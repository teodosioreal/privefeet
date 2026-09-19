<?php
/*
 * WEBHOOK RECEPTOR -> AVISO NO SEU WHATSAPP + CONFIRMAÇÃO PARA A PESSOA
 * ---------------------------------------------------------------------
 * Suba este arquivo na sua hospedagem (ex.: public_html/webhook.php)
 * e cole o endereço dele em WEBHOOK_URL no arquivo src/content/config.ts do site.
 *
 * PREENCHER ANTES DE USAR (só as linhas do bloco CONFIGURAÇÃO):
 *   1) $SEU_NUMERO_WHATSAPP  -> número que RECEBE o aviso (código do país + DDD, só números. Ex.: 5511987654321)
 *   2) $WHATSAPP_TOKEN       -> token da API do WhatsApp (Meta / Facebook Developers)
 *   3) $WHATSAPP_PHONE_ID    -> Phone Number ID da API do WhatsApp
 *
 * O que este arquivo faz quando alguém termina o formulário:
 *   • Envia para VOCÊ: nome, nascimento, idade, gênero, as 5 respostas, WhatsApp da pessoa, tempo e foto.
 *   • Envia para A PESSOA (no WhatsApp que ela digitou): confirmação com o nome dela.
 */

// ======================= CONFIGURAÇÃO (edite aqui) =======================
$SEU_NUMERO_WHATSAPP = '5511999999999';          // <- seu número que recebe os avisos
$WHATSAPP_TOKEN      = 'COLE_AQUI_O_TOKEN';      // <- token da API do WhatsApp (Meta)
$WHATSAPP_PHONE_ID   = 'COLE_AQUI_O_PHONE_ID';   // <- Phone Number ID da API do WhatsApp

// Mensagem de confirmação para a pessoa (pode editar à vontade)
$MSG_CONFIRMACAO = "Confirmamos seus dados preenchidos 🎉\n\nOlá, {NOME}! Já retornamos com mais informações por aqui 💬✨\nAguarde só um instante — nossa equipe vai te chamar neste mesmo número. 💛";
// =========================================================================

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, X-Webhook-Token');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['erro' => 'Use POST']); exit; }

$corpo = file_get_contents('php://input');
$dados = json_decode($corpo, true);
if (!is_array($dados)) { http_response_code(400); echo json_encode(['erro' => 'JSON inválido']); exit; }

// ---------- Função que envia mensagem pelo WhatsApp (API oficial da Meta) ----------
function enviarWhatsApp($numeroDestino, $mensagem) {
  global $WHATSAPP_TOKEN, $WHATSAPP_PHONE_ID;
  // Número precisa ter código do país. Se veio sem o 55 e é BR, completa.
  $numero = preg_replace('/\D/', '', $numeroDestino);
  if (strlen($numero) <= 11 && !str_starts_with($numero, '55')) $numero = '55' . $numero;

  $ch = curl_init("https://graph.facebook.com/v21.0/{$WHATSAPP_PHONE_ID}/messages");
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
      'Authorization: Bearer ' . $WHATSAPP_TOKEN,
      'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode([
      'messaging_product' => 'whatsapp',
      'to' => $numero,
      'type' => 'text',
      'text' => ['body' => $mensagem],
    ]),
    CURLOPT_TIMEOUT => 15,
  ]);
  $resposta = curl_exec($ch);
  $codigo   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  return ['codigo' => $codigo, 'resposta' => $resposta];
}

// ---------- 1) Confirmação para a PESSOA ----------
$nome          = $dados['nome'] ?? '(sem nome)';
$primeiroNome  = explode(' ', trim($nome))[0];
$whatsappPessoa = $dados['whatsappId'] ?? ($dados['whatsapp'] ?? '');

$msgPessoa = str_replace('{NOME}', $primeiroNome, $MSG_CONFIRMACAO);
$envioPessoa = $whatsappPessoa ? enviarWhatsApp($whatsappPessoa, $msgPessoa) : null;

// ---------- 2) Salva a foto no servidor (pasta /fotos) ----------
$linhaFoto = "*Foto:* não enviada";
if (!empty($dados['foto'])) {
  $nomeFoto = $dados['foto']['nome'] ?? 'foto';
  $linhaFoto = "*Foto:* enviada ({$nomeFoto}) — salva no servidor";
  if (!empty($dados['fotoBase64'])) {
    @mkdir(__DIR__ . '/fotos', 0755, true);
    $arquivo = __DIR__ . '/fotos/' . date('Ymd-His') . '-' . preg_replace('/[^a-zA-Z0-9._-]/', '', $nomeFoto);
    $binario = base64_decode(preg_replace('/^data:[^;]+;base64,/', '', $dados['fotoBase64']));
    if ($binario !== false) { file_put_contents($arquivo, $binario); }
  }
}

// ---------- 3) Aviso para VOCÊ ----------
$nasc    = $dados['dataNascimento'] ?? '-';
$idade   = $dados['idade'] ?? '-';
$genero  = $dados['genero'] ?? '-';
$whats   = $dados['whatsapp'] ?? $whatsappPessoa;
$duracao = $dados['duracaoSegundos'] ?? '-';

$linhas = [];
$linhas[] = "*🚨 NOVA AVALIAÇÃO RECEBIDA*";
$linhas[] = "";
$linhas[] = "*Nome:* {$nome}";
$linhas[] = "*WhatsApp:* {$whats}";
$linhas[] = "*Nascimento:* {$nasc} ({$idade} anos)";
$linhas[] = "*Gênero:* {$genero}";
$linhas[] = "";
$linhas[] = "*Respostas:*";
if (!empty($dados['respostas']) && is_array($dados['respostas'])) {
  foreach ($dados['respostas'] as $r) {
    $pergunta = $r['pergunta'] ?? '?';
    $resposta = $r['resposta'] ?? '-';
    $linhas[] = "- {$pergunta}: *{$resposta}*";
  }
}
$linhas[] = "";
$linhas[] = "*Tempo no formulário:* {$duracao}s";
$linhas[] = $linhaFoto;
$avisoOk = $envioPessoa && $envioPessoa['codigo'] >= 200 && $envioPessoa['codigo'] < 300;
$linhas[] = $avisoOk ? "*Confirmação enviada à pessoa:* ✅" : "*Confirmação enviada à pessoa:* ❌";

enviarWhatsApp($SEU_NUMERO_WHATSAPP, implode("\n", $linhas));

// ---------- 4) Resposta para o site ----------
echo json_encode(['ok' => true, 'confirmacaoEnviada' => $avisoOk]);

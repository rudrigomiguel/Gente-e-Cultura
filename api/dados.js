/**
 * Ponte entre o painel (hospedado aqui no Vercel) e a planilha-base no
 * Google Apps Script. O navegador do usuário só conversa com esta função —
 * nunca diretamente com o Google — o que evita qualquer problema de CORS e
 * mantém a URL do Apps Script fora do código que roda no navegador.
 *
 * A URL do App da Web do Apps Script (a que termina em /exec) fica na
 * variável de ambiente APPS_SCRIPT_URL, configurada no painel do Vercel em
 * Settings → Environment Variables. Não é para colar a URL direto neste
 * arquivo.
 */
export default async function handler(req, res) {
  /* Esta rota é sempre dinâmica (lê/grava dados que mudam a cada gravação);
     nunca deve ser guardada em cache por nenhuma camada (CDN do Vercel,
     navegador etc.) — sem isso, regiões diferentes da rede do Vercel podem
     servir respostas antigas de tempos em tempos, causando comportamento
     inconsistente (funciona numa tentativa, falha na próxima). */
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;

  if (!APPS_SCRIPT_URL) {
    res.status(500).json({ erro: 'APPS_SCRIPT_URL não configurada nas variáveis de ambiente do projeto no Vercel.' });
    return;
  }

  try {
    if (req.method === 'GET') {
      const acao = req.query.acao || '';
      const chave = req.query.chave || '';
      const url = `${APPS_SCRIPT_URL}?acao=${encodeURIComponent(acao)}&chave=${encodeURIComponent(chave)}`;
      const respostaGoogle = await fetch(url, { cache: 'no-store' });
      const texto = await respostaGoogle.text();
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.status(respostaGoogle.status).send(texto);
      return;
    }

    if (req.method === 'POST') {
      const corpo = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
      /* Deixa o fetch seguir o redirecionamento do Apps Script sozinho (modo
         padrão "follow"), do mesmo jeito que já funciona para a leitura (GET)
         acima. Uma tentativa anterior de "preservar o método manualmente"
         aqui acabava caindo numa página de erro do Google Drive — o próprio
         Apps Script já trata esse redirecionamento corretamente por conta
         própria quando não se interfere no processo. */
      const respostaGoogle = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: corpo
      });
      const texto = await respostaGoogle.text();
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.status(respostaGoogle.status).send(texto);
      return;
    }

    res.status(405).json({ erro: 'Método não suportado: ' + req.method });
  } catch (err) {
    res.status(502).json({ erro: 'Falha ao conversar com o Apps Script: ' + String(err) });
  }
}

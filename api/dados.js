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
      const respostaGoogle = await fetch(url);
      const texto = await respostaGoogle.text();
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.status(respostaGoogle.status).send(texto);
      return;
    }

    if (req.method === 'POST') {
      const corpo = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
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

    res.status(405).json({ erro: 'Método não suportado.' });
  } catch (err) {
    res.status(502).json({ erro: 'Falha ao conversar com o Apps Script: ' + String(err) });
  }
}

async function postPreservandoMetodo(url, corpo, tentativasRestantes = 5) {
  const resposta = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: corpo,
    redirect: 'manual'
  });
  const eRedirecionamento = [301, 302, 303, 307, 308].includes(resposta.status);
  const destino = resposta.headers.get('location');
  if (eRedirecionamento && destino && tentativasRestantes > 0) {
    return postPreservandoMetodo(destino, corpo, tentativasRestantes - 1);
  }
  return resposta;
}

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
      const respostaGoogle = await postPreservandoMetodo(APPS_SCRIPT_URL, corpo);
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

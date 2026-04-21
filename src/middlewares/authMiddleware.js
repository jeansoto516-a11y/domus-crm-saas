const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  console.log("HEADER RECEBIDO:", authHeader);

  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  let token;

  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else {
    token = authHeader;
  }

  console.log("TOKEN FINAL:", token);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.log("ERRO JWT:", err.message);
    return res.status(401).json({ error: 'Token inválido' });
  }
};
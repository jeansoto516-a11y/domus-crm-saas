const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const authMiddleware = require('./middlewares/authMiddleware');
const leadRoutes = require('./routes/leadroutes');

const app = express();

// middlewares
app.use(cors());
app.use(express.json());

// rotas
app.use('/auth', authRoutes);
app.use('/leads', leadRoutes);

// rota protegida de teste
app.get('/dashboard', authMiddleware, (req, res) => {
  res.json({
    message: 'Acesso permitido',
    user: req.user
  });
});

// PORTA DINÂMICA (IMPORTANTE PRO DEPLOY)
const PORT = process.env.PORT || 3000;

// conexão com banco + start servidor
pool.connect()
  .then(() => {
    console.log('Banco conectado ');

    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Erro ao conectar no banco', err);
  });
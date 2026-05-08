const express = require('express');
const cors = require('cors');

const pool = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const authMiddleware = require('./middlewares/authMiddleware');
const leadRoutes = require('./routes/leadroutes');

const app = express();


// =========================
// MIDDLEWARES
// =========================
app.use(cors());
app.use(express.json());


// =========================
// ROTAS
// =========================
app.use('/auth', authRoutes);
app.use('/leads', leadRoutes);


// =========================
// ROTA TESTE
// =========================
app.get('/dashboard', authMiddleware, (req, res) => {

  res.json({
    message: 'Acesso permitido',
    user: req.user
  });

});


// =========================
// ROTA HOME
// =========================
app.get('/', (req, res) => {

  res.send('DOMUS CRM API ONLINE 🚀');

});


// =========================
// PORTA DINÂMICA
// =========================
const PORT = process.env.PORT || 3000;


// =========================
// START SERVER
// =========================
pool.connect()
  .then(() => {

    console.log('Banco conectado');

    app.listen(PORT, '0.0.0.0', () => {

      console.log(`Servidor rodando na porta ${PORT}`);

    });

  })
  .catch((err) => {

    console.error('Erro ao conectar no banco', err);

  });
require('dotenv').config();

const cors = require('cors');
const express = require('express');
const pool = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const cron = require('node-cron');
const { checkTrialReminders } = require('./services/trialReminderService');

const authRoutes = require('./routes/authRoutes');
const leadRoutes = require('./routes/leadroutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminPanelRoutes = require('./routes/adminPanelRoutes');
const messageRoutes = require('./routes/messageRoutes');
const goalRoutes = require('./routes/goalRoutes');
const rentalRoutes = require('./routes/rentalRoutes');
const reminderRoutes = require('./routes/reminderRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const corsOrigin = process.env.CORS_ORIGIN || '*';

app.use(cors({ origin: corsOrigin }));
app.use(express.json());
app.use('/users', userRoutes);
app.use('/admin', adminPanelRoutes);
app.use('/messages', messageRoutes);
app.use('/goals', goalRoutes);
app.use('/rentals', rentalRoutes);
app.use('/reminders', reminderRoutes);


app.get('/', (req, res) => {
  res.json({
    name: 'Domus CRM API',
    status: 'online'
  });
});

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ status: 'error' });
  }
});

app.use('/auth', authRoutes);
app.use('/leads', leadRoutes);
app.use('/payments', paymentRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Rota nao encontrada.' });
});

pool.query('SELECT 1')
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor Domus rodando na porta ${PORT}`);
    });

    cron.schedule('0 9 * * *', () => {
      console.log('Rodando verificacao diaria de trials...');
      checkTrialReminders();
    });
  })
  .catch((err) => {
    console.error('Erro ao conectar no banco:', err);
    process.exit(1);
  });

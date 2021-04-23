const express = require('express');
const cors = require('cors');
const { PORT, CORS_ALLOWED_ORIGINS, inTestEnv } = require('./env');

const app = express();

// app settings
app.set('x-powered-by', false); // for security

const allowedOrigins = CORS_ALLOWED_ORIGINS.split(',');
const corsOptions = {
  origin: (origin, callback) => {
    if (origin === undefined || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

const students = [
  { lastName: 'BERDALA', firstName: 'Doriane' },
  { lastName: 'BOUTRIG', firstName: 'Youcef' },
  { lastName: 'DUBOIS', firstName: 'Cécile' },
  { lastName: 'GATTO', firstName: 'Ornella' },
  { lastName: 'GERARD', firstName: 'Solène' },
  { lastName: 'JAIMOND', firstName: 'Florian' },
  { lastName: 'JESUS', firstName: 'Nelson' },
  { lastName: 'KAMALO', firstName: 'Herança' },
  { lastName: 'MISSET', firstName: 'Edouard' },
  { lastName: 'MONGE', firstName: 'Brandon' },
  { lastName: 'REDONDO', firstName: 'Benoit' },
  { lastName: 'SCHNUR', firstName: 'Priscilia' },
  { lastName: 'GABORIT', firstName: 'Jonathan' },
  { lastName: 'MAUPIED', firstName: 'Joris' },
];

app.get('/students', (req, res) => {
  res.json(students);
});

// server setup
app.listen(PORT, () => {
  if (!inTestEnv) {
    console.log(`Server running on port ${PORT}`);
  }
});

// process setup : improves error reporting
process.on('unhandledRejection', (error) => {
  console.error('unhandledRejection', JSON.stringify(error), error.stack);
  process.exit(1);
});
process.on('uncaughtException', (error) => {
  console.error('uncaughtException', JSON.stringify(error), error.stack);
  process.exit(1);
});
process.on('beforeExit', () => {
  app.close((error) => {
    if (error) console.error(JSON.stringify(error), error.stack);
  });
});

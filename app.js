require('dotenv').config();
const express = require('express');
const cors = require('cors');
const joi = require('joi');
const connection = require('./db-config');
const { PORT, CORS_ALLOWED_ORIGINS, inTestEnv } = require('./env');

const app = express();
app.use(express.json());

// Connectino error
connection.connect((err) =>
  err
    ? console.error(`error connecting: ${err.stack}`)
    : console.log(`connected as id ${connection.threadId}`)
);

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

// Retrieve all reviews from an id
app.get('/movies/:tmdb_id/reviews', (req, res) => {
  const { tmdb_id } = req.params;
  connection
    .promise()
    .query('SELECT * FROM reviews WHERE tmdb_id= ?', [tmdb_id])
    .then(([results]) => {
      if (results.length) res.send(results);
      else res.sendStatus(404);
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
});

// Add a review to a movie
app.post('/movies/:tmdb_id/reviews', (req, res) => {
  const { title, userName, comment } = req.body;
  const { tmdb_id } = req.params;
  connection
    .promise()
    .query(
      'INSERT INTO reviews (title, tmdb_id, comment, user_name) VALUES (?, ?, ?, ?)',
      [title, tmdb_id, comment, userName]
    )
    .then(([results]) => {
      const newComment = {
        id: results.insertId,
        title,
        tmdb_id,
        comment,
        userName,
      };
      res.send(newComment);
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
});

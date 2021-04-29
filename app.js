require('dotenv').config();
const express = require('express');
const cors = require('cors');
const joi = require('joi');
const nodemailer = require('nodemailer');
const connection = require('./db-config');
const { PORT, CORS_ALLOWED_ORIGINS, inTestEnv } = require('./env');



const app = express();
app.use(express.json());

// Connection error
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

/* PATCH method to update a movie review
app.patch('/reviews/:tmdb_id', (req, res) => {
  let validationErrors = null;
  let existingReviews = null;
  connection
    .promise()
    .query('SELECT * FROM reviews WHERE tmdb_id = ?', [req.params.id])
    .then(([results]) => {
      existingReviews = results;
      if (!existingReviews)
        return Promise.reject(new Error('RECORD_NOT_FOUND'));
      validationErrors = joi
        .object({
          user_name: joi.string().require().max(100),
          comment: joi.string().require(),
          tmdb_id: joi.number().required(),
          title: joi.string().required().max(100),
        })
        .validate(req.body, { abortEarly: false }).error;
      if (validationErrors) return Promise.reject(new Error('INVALID_DATA'));
      return connection
        .promise()
        .query('UPDATE reviews SET ? WHERE if = ?', [req.body, req.params.id]);
    });
  then(() => res.json({ ...existingReviews, ...req.body }));
}); */

//-------------Created structure for the message---------------//
app.post('/contact', (req, res) => {
  const htmlOutput = `

<h3>Reply to :</h3>
<p>${req.body.email}</p>
<h3>you have recevied a message from : </h3>
<h4> ${req.body.firstName}, ${req.body.lastName}</h4>
<h3>Message :</h3>
---------------------------
  <p>${req.body.text}<p>
---------------------------
  `
  //------------Create a SMTP transporter object----------------------//

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });



  const message = {
    from: `projectdollyx@gmail.com`,
    to: `${req.body.email}, projectdollyx@gmail.com`,
    subject: 'test send message',
    text: 'Hello World',
    html: htmlOutput,
  };
  transporter.sendMail(message, (err, info) => {
    if (err) {
      console.log('Error occurred. ' + err.message);
      res.sendStatus(500);
    } else {
      console.log('Message sent: %s', info.messageId);
      res.sendStatus(200);
    }
  });
});

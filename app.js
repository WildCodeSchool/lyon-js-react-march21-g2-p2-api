require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Joi = require('joi');
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


// Retrieve all reviews for a movie
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

//Add a review to a movie

app.post('/movies/:tmdb_id/reviews', (req, res) => {
  const { title, user_name, comment } = req.body;
  const { tmdb_id } = req.params;

  const { error: validationErrors } = Joi.object({
    user_name: Joi.string().min(2).max(50).required(),
    comment: Joi.string().min(2).required(),
  }).validate({ user_name, comment }, { abortEarly: false });

  if (validationErrors) {
    res.status(422).send({ error: validationErrors.details });
  } else {
    connection
      .promise()
      .query(
        'INSERT INTO reviews (title, tmdb_id, comment, user_name) VALUES (?, ?, ?, ?)',
        [title, tmdb_id, comment, user_name]
      )
      .then(([results]) => {
        const newComment = {
          id: results.insertId,
          title,
          tmdb_id,
          comment,
          user_name,
        };
        res.send(newComment);
      })
      .catch((err) => {
        console.error(err);
        res.sendStatus(500);
      });
  }
});

//-------------Created structure for the message---------------//

app.post('/contact', (req, res) => {
  const htmlOutput = `
    <p>Hi ${req.body.firstName}</p>
    <p>Thank you so much for reaching out.</p>
    <p>We received your email and someone from our team will be in touch soon.</p>
    <p>Best,</p> 
    <h4>The Dolly Team</h4>
    ---------------------------   
    <h4>Reply to : ${req.body.firstName} ${req.body.lastName}</h4>
    <p>${req.body.email}</p>
    <h3>Message :</h3>
    <p>${req.body.text}<p></p>
    ---------------------------`;
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
    bcc: `${req.body.email}, projectdollyx@gmail.com`,
    subject: 'We got it',
    text: `Hi ${req.body.firstName}, 
    Thank you for reaching out.
    We received your email and someone from our team will be in touch soon.
    Best, 
    The Dolly Team
    ---------------------------   
    Reply to : ${req.body.firstName} ${req.body.lastName}
    ${req.body.email}
    Message :
    ${req.body.text}
    ---------------------------`,
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

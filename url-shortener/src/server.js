'use strict';
require('dotenv').config();
const dns = require('dns');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
const express = require('express');
const app = express();
const router = express.Router();

// Install and Set Up Mongoose
try {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  console.log('Connected to database');
} catch (err) {
  throw new Error('Failed to connect to database');
}

// Create a Model
const UrlSchema = new mongoose.Schema({
  originalUrl: { type: String, unique: true },
  shortUrl: { type: String, unique: true }
});
const Url = mongoose.model('Url', UrlSchema);

// Check if the originalUrl exists in the database
const findOneByOriginalUrl = (originalUrl, done) => {
  Url.findOne({ originalUrl }, (err, url) => {
    if (err) return done(err);
    done(null, url);
  });
};

// Create a new record with a unique shortUrl and return the data
const createAndSaveUrl = (originalUrl, done) => {
  const shortUrl = `${Math.floor(Math.random() * 100000)}`;
  const newUrl = new Url({ originalUrl, shortUrl });
  newUrl.save((err, url) => {
    if (err) return done(err);
    done(null, url);
  });
};

const urlRegex = new RegExp(
  /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})).?)(?::\d{2,5})?(?:[/?#]\S*)?$/i
);

// Handle POST requests to /api/shorturl
router.post('/api/shorturl', (req, res) => {
  const { originalUrl } = req.body;
  // console.log(originalUrl);
  try {
    findOneByOriginalUrl(originalUrl, (err, url) => {
      if (err) return res.status(500).json({ error: err.message });
      if (url) {
        const { originalUrl: original_url, shortUrl: short_url } = url;
        return res.status(200).json({ original_url, short_url });
      }
      if (!originalUrl.match(urlRegex)) {
        return res.json({ error: 'invalid url' });
      } else {
        const urlObj = new URL(originalUrl);
        dns.lookup(urlObj.hostname, (err, address, family) => {
          //console.log(originalUrl, urlObj.hostname, address, family);
          if (err) return res.json({ error: 'invalid url' });
          createAndSaveUrl(originalUrl, (err, url) => {
            if (err) return res.status(500).json({ error: err.message });
            const { originalUrl: original_url, shortUrl: short_url } = url;
            return res.status(200).json({ original_url, short_url });
          });
        });
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'invalid url' });
  }
});

// Handle GET requests to /api/shorturl/:shortUrl
router.get('/api/shorturl/:shortUrl', (req, res) => {
  const { shortUrl } = req.params;
  try {
    Url.findOne({ shortUrl }, (err, url) => {
      // if (err) return res.status(500).json({ error: err.message });
      if (url) return res.redirect(301, url.originalUrl);
      return res
        .status(404)
        .json({ error: 'No short URL found for the given input' });
    });
  } catch (err) {
    res.status(404).json({ error: 'No short URL found for the given input' });
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/.netlify/functions/server', router); // path must route to lambda
app.use('/', (_, res) => res.sendFile(`${__dirname}/index.html`));

// app.listen(3000, () => console.log('Listening on port 3000'));

module.exports.handler = serverless(app);

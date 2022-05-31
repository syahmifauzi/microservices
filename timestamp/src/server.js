'use strict';
const serverless = require('serverless-http');
const express = require('express');
const app = express();
const router = express.Router();

const isValidDate = (date) => {
  return date instanceof Date && !isNaN(date);
};

const getDateObject = (date) => {
  const isNum = /^\d+$/.test(date);
  return new Date(isNum ? parseInt(date) : date);
};

router.get('/api/:date?', (req, res) => {
  const { date } = req.params;
  const dateObj = getDateObject(date);
  if (!date) {
    const unix = Date.now();
    const utc = new Date().toUTCString();
    res.json({ unix, utc });
  } else if (isValidDate(dateObj)) {
    const unix = dateObj.getTime();
    const utc = dateObj.toUTCString();
    res.json({ unix, utc });
  } else {
    res.status(400).json({ error: 'Invalid Date' });
  }
});

app.use('/.netlify/functions/server', router); // path must route to lambda
app.use('/', (_, res) => res.sendFile(`${__dirname}/index.html`));

// app.listen(3000, () => console.log('Listening on port 3000'));

module.exports.handler = serverless(app);

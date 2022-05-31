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

router.get('/api/:date', (req, res) => {
  const dateObj = getDateObject(req.params.date);
  if (isValidDate(dateObj)) {
    const unix = dateObj.getTime();
    const utc = dateObj.toUTCString();
    res.json({ unix, utc });
  } else {
    res.status(400).json({ error: 'Invalid Date' });
  }
});

app.use('/.netlify/functions', router); // path must route to lambda
app.use('/', (req, res) => res.sendFile(`${__dirname}/index.html`));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}`));

module.exports = app;
module.exports.handler = serverless(app);

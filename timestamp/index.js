'use strict';
const serverless = require('serverless-http');
const express = require('express');
const app = express();

const isValidDate = (date) => {
  return date instanceof Date && !isNaN(date);
};

const getDateObject = (date) => {
  const isNum = /^\d+$/.test(date);
  return new Date(isNum ? parseInt(date) : date);
};

app.get('/api/:date', (req, res) => {
  const dateObj = getDateObject(req.params.date);
  if (isValidDate(dateObj)) {
    const unix = dateObj.getTime();
    const utc = dateObj.toUTCString();
    res.json({ unix, utc });
  } else {
    res.status(400).json({ error: 'Invalid Date' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}`));

module.exports.handler = serverless(app);

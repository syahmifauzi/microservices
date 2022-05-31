'use strict';
const serverless = require('serverless-http');
const express = require('express');
const app = express();
const router = express.Router();

router.get('/api/whoami', (req, res) => {
  const ipaddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const language = req.headers['accept-language'];
  const software = req.headers['user-agent'];
  res.json({ ipaddress, language, software });
});

app.use('/.netlify/functions/server', router); // path must route to lambda
app.use('/', (_, res) => res.sendFile(`${__dirname}/index.html`));

// app.listen(3000, () => console.log('Listening on port 3000'));

module.exports.handler = serverless(app);

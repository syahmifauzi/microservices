'use strict';
const fileUpload = require('express-fileupload');
const serverless = require('serverless-http');
const express = require('express');
const app = express();
const router = express.Router();

router.post('/api/fileanalyse', (req, res) => {
  const { name, size, mimetype: type } = req.files.upfile;
  res.status(200).json({ name, size, type });
});

app.use(fileUpload({ useTempFiles: true, tempFileDir: '/tmp' }));
app.use('/.netlify/functions/server', router); // path must route to lambda
app.use('/', (_, res) => res.sendFile(`${__dirname}/index.html`));

// app.listen(3000, () => console.log('Listening on port 3000'));

module.exports.handler = serverless(app);

'use strict';
require('dotenv').config();
const serverless = require('serverless-http');
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const router = express.Router();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Install and Set Up Mongoose
try {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  console.log('Connected to database');
} catch (error) {
  throw new Error('Failed to connect to database');
}

// Create a User Model
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  exercises: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' }],
  log: { type: Array }
});
const User = mongoose.model('User', UserSchema);

// Create a Exercise Model
const ExerciseModel = new mongoose.Schema({
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});
const Exercise = mongoose.model('Exercise', ExerciseModel);

// Mongoose Functions
const findUserByUsername = (username, done) => {
  User.findOne({ username }, (err, user) => {
    if (err) return done(err);
    return done(null, user);
  });
};

const findUserById = (id, done) => {
  User.findById(id, (err, user) => {
    if (err) return done(err);
    return done(null, user);
  });
};

const createUser = (username, done) => {
  const newUser = new User({ username });
  findUserByUsername(username, (err, user) => {
    if (err) return done(err);
    if (user) return done(null, user);
    newUser.save((err, user) => {
      if (err) return done(err);
      return done(null, user);
    });
  });
};

const getAllUsers = (done) => {
  User.find({}, (err, users) => {
    if (err) return done(err);
    return done(null, users);
  });
};

const createExercise = (_id, data, done) => {
  const newExercise = new Exercise({
    description: data.description,
    duration: data.duration,
    date: data.date ? new Date(data.date) : new Date(),
    owner: _id
  });
  newExercise.save((err, exercise) => {
    if (err) return done(err);
    return done(null, exercise);
  });
};

const createUserLog = (_id, data) => {
  findUserById(_id, (err, user) => {
    if (err) return;
    const { description, duration, date } = data;
    user.log.push({
      description,
      duration: parseInt(duration),
      date: date ? new Date(date) : new Date()
    });
    user.save();
  });
};

// Express Routes
router.post('/api/users', (req, res) => {
  const { username } = req.body;
  try {
    createUser(username, (err, user) => {
      if (err) return res.status(400).json({ error: err });
      return res.json({ username: user.username, _id: user._id });
    });
  } catch (error) {
    res.status(500).json({ error });
  }
});

router.get('/api/users', (req, res) => {
  try {
    getAllUsers((err, users) => {
      if (err) return res.status(500).json({ error: err });
      res.json(users);
    });
  } catch (error) {
    res.status(500).json({ error });
  }
});

router.post('/api/users/:_id/exercises', (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;
  const data = { description, duration, date };
  try {
    findUserById(_id, (err, user) => {
      if (err) return res.status(400).json({ error: err });
      if (!user) return res.status(404).json({ error: 'User not found' });
      createExercise(_id, data, (err, exercise) => {
        if (err) return res.status(400).json({ error: err });
        createUserLog(_id, data);
        return res.json({
          _id,
          username: user.username,
          date: new Date(exercise.date).toDateString(),
          duration: exercise.duration,
          description: exercise.description
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error });
  }
});

router.get('/api/users/:_id/logs', (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;
  try {
    User.findById(_id, (err, user) => {
      if (err) return res.status(500).json({ error: err });
      const [fromDate, toDate] = [
        new Date(from).getTime(),
        new Date(to).getTime()
      ];
      let logs = user.log || [];
      if (from)
        logs = logs.filter(({ date }) => new Date(date).getTime() >= fromDate);
      if (to)
        logs = logs.filter(({ date }) => new Date(date).getTime() <= toDate);
      if (limit) logs = logs.slice(0, parseInt(limit));
      logs = logs.sort((a, b) => b.date - a.date);
      logs = logs.map(({ date, ...rest }) => ({
        ...rest,
        date: new Date(date).toDateString()
      }));
      const resData = {
        _id,
        username: user.username,
        count: logs.length,
        log: logs
      };
      if (from) resData.from = new Date(from).toDateString();
      if (to) resData.to = new Date(to).toDateString();
      res.json(resData);
    });
  } catch (error) {
    res.status(500).json({ error });
  }
});

app.use('/.netlify/functions/server', router); // path must route to lambda
app.use('/', (_, res) => res.sendFile(`${__dirname}/index.html`));

// app.listen(3000, () => console.log('Listening on port 3000'));

module.exports.handler = serverless(app);

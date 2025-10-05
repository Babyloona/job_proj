require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const tasksRouter = require('./routes/tasks');

const app = express();
app.use(helmet());
app.use(express.json());
app.use(morgan('combined'));

const API_KEY = process.env.API_KEY ;
app.use((req, res, next) => {
  const key = req.header('X-API-Key');
  if (!key || key !== API_KEY) return res.status(401).json({ error: { code:'UNAUTHORIZED', message:'Invalid API Key' }});
  next();
});

app.use('/tasks', tasksRouter);

app.use((err, req, res, next) => {
  console.error(err);
  const code = err.code || 'INTERNAL';
  res.status(err.status || 500).json({ error: { code, message: err.message || 'Server error', details: err.details || null }});
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Listening ${port}`));

import createError from 'http-errors';
import express from 'express';
import path  from 'path';
import cookieParser from 'cookie-parser';
const logger = require('morgan'); // deprecation warning with import keyword 
import mongoose from 'mongoose';
import cors from 'cors';
import {dbString, dbPw} from './config';
import indexRouter from './routes/index';

const app = express();

const mongoDB = dbString; 

mongoose.connect(mongoDB);

mongoose.Promise = global.Promise;

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const allowedOrigins = ['http://localhost:4200','http://localhost:3000',
                      'http://yourapp.com'];
app.use(cors({
  credentials: true,
  origin: function(origin, callback){
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      const msg = 'The CORS policy for this site does not ' +
                'allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

const session = require('express-session');
app.use(session({
  secret: 'work hard',
  resave: true,
  saveUninitialized: false
}));

app.use( (req, res, next) => {
  res.locals.session = req.session;
  next();
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

app.set('json spaces', 1)

export default app;
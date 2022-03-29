import Express, { Application, Request, Response, NextFunction } from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import mongoose from "mongoose";

import cors from "cors";
import dotenv from "dotenv";

import UserRouter from "./routes/UserRouter";
import WordRouter from "./routes/WordRouter";

/// Environment variables
declare var process: {
  env: {
    CONNECTION_STRING: string;
    SESSION_SECRET_KEY: string;
  };
};

const databaseOptions = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
};

const app: Application = Express();
dotenv.config();

mongoose.connect(process.env.CONNECTION_STRING, databaseOptions);
mongoose.Promise = global.Promise;
const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));

const allowedOrigins: string[] = ["http://localhost:3002"];

app.use("/users", UserRouter);
app.use("/words", WordRouter);

app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not " +
          "allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET_KEY,
    resave: false,
    saveUninitialized: true,
  })
);

app.set("json spaces", 1);

app.use(morgan("dev"));
app.use(Express.json());
app.use(Express.urlencoded({ extended: false }));
app.use(cookieParser());

export default app;

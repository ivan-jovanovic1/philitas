import Express, { Application, Request, Response, NextFunction } from "express";
import session from "express-session";
import httpError from "http-errors";
import path from "path";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import mongoose from "mongoose";
import ConnectMongoDBStore, {
  MongoDBSessionOptions,
} from "connect-mongodb-session";
import cors from "cors";
import dotenv from "dotenv";
import userRouter from "./routes/UserRouter";

const MongoDBStore = ConnectMongoDBStore(session);
/// Environment variables
declare var process: {
  env: {
    CONNECTION_STRING: string;
    SESSION_SECRET_KEY: string;
  };
};
// const mongoDBSessionOptions: MongoDBSessionOptions = {
//   uri: process.env.CONNECTION_STRING, //xprocess.env.CONNECTION_STRING,
//   collection: "sessions",
//   // expires?: number | undefined;
//   // databaseName?: string | undefined;
//   // connectionOptions?: MongoClientOptionsx | undefined;
//   // idField?: string | undefined;
// };
// const store = new MongoDBStore(mongoDBSessionOptions, (error) => {
//   console.log(error);
//   console.log(`Wrong DB credentials ${process.env.CONNECTION_STRING}`);
// });

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

const allowedOrigins: string[] = [
  "http://localhost:4200",
  "http://localhost:3002",
  "http://yourapp.com",
];

app.use("/users", userRouter);

app.use(
  cors({
    credentials: true,
    origin: function (origin, callback) {
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
    // store: store,
    // cookie: {
    //   maxAge: 1000 * 86400 * 7, // 7 days in milliseconds
    // },
  })
);

app.set("json spaces", 1);

app.set("views", path.join(__dirname, "./../views"));
app.set("view engine", "hbs");

app.use(morgan("dev"));
app.use(Express.json());
app.use(Express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(Express.static(path.join(__dirname, "./../public")));

app.use((request: Request, response: Response, next: NextFunction) => {
  next(httpError(404));
});

export default app;

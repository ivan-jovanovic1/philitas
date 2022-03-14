import { Router, Request, Response, NextFunction } from "express";
import { UserController } from "../controllers/UserController";
import bodyParser from "body-parser";
import jsonWebToken from "jsonwebtoken";
import { UserModel } from "../models/User";
import session from "express-session";

declare var process: {
  env: {
    JWS_TOKEN_SECRET: string;
  };
};
const router = Router();

const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.json(new Error("Unauthorized"));

  console.log(`Ivan, ${token}`);
  jsonWebToken.verify(
    token,
    process.env.JWS_TOKEN_SECRET as string,
    (err, user) => {
      if (err) return res.json(new Error("Forbidden"));

      UserModel.findOne({ authToken: token })
        .then((user) => {
          if (user != null) {
            req.session.user = {
              id: user!._id!!,
              jwsToken: user!.authToken!!,
            };
            next();
          } else {
            res.json(new Error("Unauthorized here"));
          }
        })
        .catch((error) => {
          res.json(new Error("Internal server error"));
        });
    }
  );
};

/* GET home page. */
router.get("/", (req: Request, res: Response) => {
  res.json({
    title: "My express app",
    description: "Hello world",
  });
});

router.get("/tokenCheck", bodyParser.json(), (req: Request, res: Response) => {
  res.json({ status: "Works perfectly." });
});

router.post(
  "/register",
  [bodyParser.json(), authenticateToken],
  UserController.create
);
router.post("/login", bodyParser.json(), UserController.login);

export default router;

import { Router, Request, Response, NextFunction } from "express";
import { UserController } from "../controllers/UserController";
import { json } from "body-parser";
import { authenticateToken } from "../helpers/auth-helpers/AuthenticateToken";

const UserRouter = Router();

/* GET home page. */
UserRouter.get("/", (req: Request, res: Response) => {
  res.json({
    title: "My express app",
    description: "Hello world",
  });
});

UserRouter.get(
  "/tokenCheck",
  [json(), authenticateToken],
  (req: Request, res: Response) => {
    res.json({ status: "Works perfectly." });
  }
);

UserRouter.post("/register", json(), UserController.create);
UserRouter.post("/login", json(), UserController.login);

export default UserRouter;

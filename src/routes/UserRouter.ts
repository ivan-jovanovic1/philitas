import { Router, Request, Response, NextFunction } from "express";
import { UserController } from "../controllers/UserController";
import { json } from "body-parser";
import authenticateToken from "../helpers/auth-helpers/AuthenticateToken";

const router = Router();

/* GET home page. */
router.get("/", (req: Request, res: Response) => {
  res.json({
    title: "My express app",
    description: "Hello world",
  });
});

router.get(
  "/tokenCheck",
  [json(), authenticateToken],
  (req: Request, res: Response) => {
    res.json({ status: "Works perfectly." });
  }
);

router.post("/register", json(), UserController.create);
router.post("/login", json(), UserController.login);

export default router;

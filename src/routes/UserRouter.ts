import { Router, Request, Response } from "express";
import { UserController } from "../controllers/UserController";
import bodyParser from "body-parser";

const router = Router();

/* GET home page. */
router.get("/lol", (req: Request, res: Response) => {
  res.json({
    title: "My express app",
    description: "Hello world",
  });
});

router.post("/register", bodyParser.json(), UserController.create);
router.post("/login", bodyParser.json(), UserController.login);

export default router;

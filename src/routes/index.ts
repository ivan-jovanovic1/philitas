import { Router, Request, Response } from "express";
// import IndexController from '../controllers/IndexController.js';

const router = Router();

/* GET home page. */
router.get("/", (req: Request, res: Response) => {
  res.json({
    title: "My express app",
    description: "Hello world"
  });
});

export default router;

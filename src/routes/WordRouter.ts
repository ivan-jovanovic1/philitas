import { Router, Request, Response, NextFunction } from "express";

const WordRouter = Router();

/* GET home page. */
WordRouter.get("/", (req: Request, res: Response) => {
  res.json({
    title: "My express app",
    description: "Hello world",
  });
});

export default WordRouter;

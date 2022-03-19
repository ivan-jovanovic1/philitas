import { Router, Request, Response, NextFunction } from "express";
import { WordController } from "../controllers/WordController";

const WordRouter = Router();

/* GET home page. */
WordRouter.get("/:word/:page", WordController.singleResult);

WordRouter.get("/:word", WordController.singleResult);

export default WordRouter;

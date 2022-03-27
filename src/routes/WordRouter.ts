import { Router, Request, Response, NextFunction } from "express";
import { WordController } from "../controllers/WordController";

const WordRouter = Router();

/* GET home page. */
WordRouter.get("/:word/:page", WordController.singleResult);

/**
 * Uses query params `page` and `pageSize`.
 * Default value for `page` is 1.
 * Default value for `pageSize` is 25.
 */
WordRouter.get("/list", WordController.list);

// WordRouter.get("/:word", WordController.singleResult);

export default WordRouter;

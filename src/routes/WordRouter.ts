import { Router, Request, Response } from "express";
import { WordController } from "../controllers/WordController";

const WordRouter = Router();

namespace Route {
  export const list = "/list/all";
  export const word = "/:word";
  export const wordId = "/byId/:id";
}

async function methodFromRoute(req: Request, res: Response) {
  if (req.route.path === Route.list) {
    WordController.list(req, res);
    return;
  }

  if (req.route.path === Route.word) {
    WordController.singleResult(req, res);
    return;
  }

  if (req.route.path == Route.wordId) {
    WordController.singleFromId(req, res);
    return;
  }

  res.status(404).send({ errorMessage: "Page not found" });
}

WordRouter.get(Route.list, methodFromRoute);
WordRouter.get(Route.word, methodFromRoute);
WordRouter.get(Route.wordId, methodFromRoute);

export default WordRouter;

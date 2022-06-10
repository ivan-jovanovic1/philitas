import { Router, Request, Response } from "express";
import { WordController } from "../controllers/WordController";
import { json } from "body-parser";

const WordRouter = Router();

namespace Route {
  export const list = "/list/all";
  export const word = "/:word";
  export const wordId = "/byId/:id";
  export const wordIdToFavorites = "/favorites";
}

async function methodFromRoute(req: Request, res: Response) {
  if (req.route.path === Route.list) {
    return WordController.list(req, res);
  }

  if (req.route.path === Route.word) {
    return WordController.singleResult(req, res);
  }

  if (req.route.path == Route.wordId) {
    return WordController.singleFromId(req, res);
  }

  if (req.route.path == Route.wordIdToFavorites) {
    return WordController.addFavoriteWordIdToCurrentUser(req, res);
  }

  res.status(404).send({ errorMessage: "Page not found" });
}

WordRouter.get(Route.list, methodFromRoute);
WordRouter.get(Route.word, methodFromRoute);
WordRouter.get(Route.wordId, methodFromRoute);

WordRouter.post(Route.wordIdToFavorites, json(), methodFromRoute);

export default WordRouter;

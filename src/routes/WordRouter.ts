import { Router, Request, Response } from "express";
import { WordController } from "../controllers/WordController";
import { json } from "body-parser";

const WordRouter = Router();

namespace Route {
  export const list = "/list/all";
  export const word = "/:word";
  export const wordId = "/byId/:id";
  export const favorites = "/favorites";
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

  if (req.route.path == Route.favorites) {
    if (req.method === "GET") {
      return WordController.favoriteList(req, res);
    }

    if (req.method === "POST") {
      return WordController.addFavoriteWordIdToCurrentUser(req, res);
    }
  }

  return res.status(404).send({ errorMessage: "Page not found" });
}

WordRouter.get(Route.list, methodFromRoute);
WordRouter.get(Route.word, methodFromRoute);
WordRouter.get(Route.wordId, methodFromRoute);
WordRouter.get(Route.favorites);

WordRouter.post(Route.favorites, json(), methodFromRoute);

export default WordRouter;

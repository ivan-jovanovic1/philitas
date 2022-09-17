import { Router, Request, Response } from "express";
import { WordController } from "../controllers/WordController";
import { json } from "body-parser";

const WordRouter = Router();

namespace Route {
  export const list = "/list/all";
  export const searchWord = "/search/:query";
  export const wordId = "/byId/:id";
  export const favorites = "/favorites";
}

async function methodFromRoute(req: Request, res: Response) {
  if (req.url.includes(Route.favorites)) {
    if (req.method === "GET") {
      return WordController.favoriteList(req, res);
    }

    if (req.method === "POST") {
      return WordController.updateFavoritesForUser(req, res, false);
    }

    if (req.method === "DELETE") {
      return WordController.updateFavoritesForUser(req, res, true);
    }
  }

  if (req.route.path === Route.searchWord) {
    return WordController.search(req, res);
  }

  if (req.route.path === Route.list) {
    return WordController.list(req, res);
  }

  if (req.route.path == Route.wordId) {
    return WordController.singleFromId(req, res);
  }

  return res.status(404).send({ errorMessage: "Page not found" });
}

WordRouter.get(Route.list, methodFromRoute);
WordRouter.get(Route.wordId, methodFromRoute);
WordRouter.get(Route.favorites, methodFromRoute);
WordRouter.get(Route.searchWord, methodFromRoute);

WordRouter.post(Route.favorites, json(), methodFromRoute);
WordRouter.delete(Route.favorites, json(), methodFromRoute);

export default WordRouter;

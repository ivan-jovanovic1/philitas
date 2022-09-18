import { Request, Response } from "express";
import { scrapeTermania } from "../external/services/ScrapeService";
import { WordModel, Word } from "../models/Word";
import { Page } from "../shared/Pagination";
import { ObjectId } from "mongodb";
import { TermaniaWord } from "../external/models/ScrapeModels";
import { responseObject } from "../models/BaseResponse";
import { ErrorCode } from "../models/ErrorCode";
import { WordService } from "../service/WordService";
import { FavoriteWordService } from "../service/FavoriteWordService";
import { isString } from "../shared/SharedHelpers";
import {
  isTokenNotValidResponse,
  isTokenValid,
} from "../service/TokenValidator";
import { UserService } from "../service/UserService";

import { IncomingHttpHeaders } from "http";

declare module "http" {
  interface IncomingHttpHeaders {
    "user-id"?: string;
  }
}
export namespace WordController {
  export async function search(req: Request, res: Response) {
    const query = req.params.query;

    if (!isString(query)) {
      res.status(400).send(
        responseObject({
          errorCode: ErrorCode.undefinedData,
          errorMessage: "Undefined query.",
        })
      );
      return;
    }

    try {
      let word = await WordService.wordFromDB(query);
      if (!word) {
        const data = await scrapeTermania(query, 2);
        await saveWordsToDB(data);
        word = await WordService.wordFromDB(query);
      }

      let words: Word[] = await WordModel.find({ word: { $regex: query } });
      words = words.filter((obj) => {
        if (word === null) return true;
        return obj.word !== word.word;
      });

      if (word) {
        res.status(200).send(
          responseObject({
            data: [word].concat(words),
          })
        );
      } else {
        res.status(200).send(
          responseObject({
            data: words,
          })
        );
      }
    } catch (e) {
      res.status(500).send(
        responseObject({
          errorCode: 500,
          errorMessage: "Internal server error.",
        })
      );
    }
  }
  /**
   * Returns a list of words based on page and page size.
   * The words are sorted by alphabet order.
   *
   * @param req Request with page and pageSize parameters.
   * @param res Response with pagination and the list of the words for the current page.
   */
  export async function list(req: Request, res: Response) {
    const page = Page.normalizedPage(req.query.page);
    const pageSize = Page.normalizedPageSize(req.query.pageSize);

    try {
      const pagination = await WordService.allWordsPagination(page, pageSize);
      const words = await WordService.allWordsList(page, pageSize);

      res.json(
        responseObject({
          data: words,
          pagination: pagination,
        })
      );
    } catch (e) {
      res.status(500).send(
        responseObject({
          errorMessage: "Internal server error.",
          errorCode: 500,
        })
      );
      console.error(e);
    }
  }

  /**
   * Returns a list of the user's favorite words based on page and page size.
   * The words are sorted by alphabet order.
   *
   * @param req Request with page and pageSize parameters.
   * @param res Response with pagination and the list of the words for the current page.
   */
  export async function favoriteList(req: Request, res: Response) {
    const page = Page.normalizedPage(req.query.page);
    const pageSize = Page.normalizedPageSize(req.query.pageSize);

    const userId = req.headers["user-id"]; //?.split(" "[1]);

    if (!isString(userId)) {
      res.status(401).send(
        responseObject({
          errorCode: ErrorCode.undefinedData,
          errorMessage: "Invalid user id header",
        })
      );
      return;
    }

    try {
      const pagination = await FavoriteWordService.pagination(
        page,
        pageSize,
        userId!
      );
      const words = await FavoriteWordService.wordList(page, pageSize, userId!);
      res.json(
        responseObject({
          data: words,
          pagination: pagination,
        })
      );
    } catch (e) {
      console.error(e);
      res.status(500).send(
        responseObject({
          errorMessage: "Internal server error.",
          errorCode: 500,
        })
      );
    }
  }

  export async function singleFromId(req: Request, res: Response) {
    const wordId = req.params.id;
    if (!ObjectId.isValid(wordId)) {
      res
        .status(400)
        .json(responseObject({ errorMessage: "Invalid id.", errorCode: 400 }));
      return;
    }

    const objectId = new ObjectId(wordId);

    try {
      const wordDB = await WordService.wordFromId(objectId);
      if (wordDB) {
        await WordService.updateHits(wordDB);
        res.status(200).send(responseObject({ data: wordDB }));
      } else {
        res.status(404).send(
          responseObject({
            errorMessage: "Not found in DB.",
            errorCode: ErrorCode.notFoundData,
          })
        );
      }
    } catch (e) {
      res
        .status(500)
        .send(responseObject({ errorMessage: "Internal server error." }));
    }
  }

  /**
   * Adds or removes the word from favorites for the current user.
   *
   * @param req The request.
   * @param res The response.
   * @param remove The flag which indicates that word should be removed.
   */
  export async function updateFavoritesForUser(
    req: Request,
    res: Response,
    remove: Boolean
  ) {
    const userId = req.headers["user-id"];
    const wordId = req.body.id;

    if (!isString(userId) || !ObjectId.isValid(wordId)) {
      res.status(401).send(
        responseObject({
          data: false,
          errorMessage: `${isString(userId) ? "WordId" : "UserId"} not valid.`,
          errorCode: 401,
        })
      );
      return;
    }

    try {
      await FavoriteWordService.update(wordId as string, remove, userId!);
      res.status(200).send(
        responseObject({
          data: true,
        })
      );
    } catch {
      res.status(404).send(
        responseObject({
          errorMessage: "Unable to add to favorites.",
          errorCode: ErrorCode.unableToAddToFavorites,
          data: false,
        })
      );
    }
  }

  /**
   * Tries to save words to DB.
   *
   * @param results Results from scrapping.
   */
  async function saveWordsToDB(results: TermaniaWord[]) {
    for (const word of results) {
      const wordModel = new WordModel(word);

      try {
        await wordModel.save();
      } catch (e) {
        console.error(e);
      }
    }
  }
}

export default WordController;

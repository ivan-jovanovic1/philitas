import { Request, Response } from "express";
import { scrapeTermania } from "../external/services/ScrapeService";
import { WordModel, Word } from "../models/Word";
import { User, UserModel } from "../models/User";
import Translate from "../external/services/TranslateService";
import { Pagination, Page } from "../shared/Pagination";
import { ObjectId } from "mongodb";
import { ResponseWithPagination } from "../external/models/ScrapeModels";
import { responseObject } from "../models/BaseResponse";
import { ErrorCode } from "../models/ErrorCode";
import { WordService } from "../service/WordService";
import { isString } from "../shared/SharedHelpers";
import { isTokenValid } from "../service/TokenValidator";

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

    const token = req.headers["authorization"]?.split(" ")[1];

    if (token === undefined || token === null) {
      return res.status(401).send(
        responseObject({
          data: false,
          errorMessage: "Token not valid.",
          errorCode: 401,
        })
      );
    }

    const userDB = await UserModel.findOne({ jwsToken: token });
    const user = userDB as User;

    if (userDB === null) {
      return res.status(401).send(
        responseObject({
          data: false,
          errorMessage: "Token not valid.",
          errorCode: 401,
        })
      );
    }

    const filtered = user.favoriteWordIds.filter(
      (value) => ObjectId.isValid(value) && value.length > 10
    );

    if (filtered.length === 0) {
      return res.status(400).send(
        responseObject({
          data: false,
          errorMessage: "User dont have favorite words.",
          errorCode: 400,
        })
      );
    }

    const pagination: Pagination = {
      currentPage: page,
      allPages: Math.ceil(
        Number(
          await WordModel.collection.countDocuments({
            _id: { $in: filtered },
          })
        ) / pageSize
      ),
      pageSize: pageSize,
    };

    try {
      const words = await WordModel.find({ _id: { $in: filtered } })
        .sort({ mainLanguge: -1, word: 1 })
        .skip(Page.beginAt(page, pageSize))
        .limit(pageSize);
      res.json(
        responseObject({
          data: words,
          pagination: pagination,
        })
      );
    } catch (e) {
      console.error(e);
    }
  }

  export async function singleFromId(req: Request, res: Response) {
    const wordId = req.params.id;
    if (!isString(wordId) || !wordId.match(/^[0-9a-fA-F]{24}$/)) {
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
        res
          .status(404)
          .send(responseObject({ errorMessage: "Not found in DB." }));
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
    const token = req.headers["authorization"]?.split(" ")[1];
    const wordId = req.body.id;
    const isValidToken = isTokenValid(token);

    if (!isValidToken || !ObjectId.isValid(wordId)) {
      return res.status(401).send(
        responseObject({
          data: false,
          errorMessage: `${isValidToken ? "WordId" : "Token"} not valid.`,
          errorCode: 401,
        })
      );
    }

    try {
      if (remove) {
        await UserModel.updateOne(
          { jwsToken: token },
          { $pull: { favoriteWordIds: wordId } }
        );
      } else {
        await UserModel.updateOne(
          { jwsToken: token },
          { $addToSet: { favoriteWordIds: wordId } }
        );
      }

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
  async function saveWordsToDB(results: ResponseWithPagination[]) {
    for (const result of results) {
      for (const section of result.allSections) {
        for (let termaniaWord of section.wordsWithExplanations) {
          if (
            termaniaWord.language !== "sl" &&
            termaniaWord.explanations.length === 0
          )
            continue;

          let word = new Word(termaniaWord);

          const translation = await Translate.englishSloveneInvertible(
            termaniaWord.word,
            termaniaWord.language
          );

          if (translation !== null) {
            word.translations.push(translation);
          }

          const wordModel = new WordModel(word);

          try {
            await wordModel.save();
          } catch (e) {
            console.error(e);
          }
        }
      }
    }
  }
}

export default WordController;

import { Request, Response } from "express";
import { scrapeTermania } from "../external/services/ScrapeService";
import { WordModel, Word, updateSearchHits } from "../models/Word";
import { User, UserModel } from "../models/User";
import Translate from "../external/services/TranslateService";
import { Pagination, Page } from "../shared/Pagination";
import { ObjectId } from "mongodb";
import { ResponseWithPagination } from "../external/models/ScrapeModels";
import { responseObject } from "../models/BaseResponse";
import { ErrorCode } from "../models/ErrorCode";

export namespace WordController {
  export async function search(req: Request, res: Response) {
    const param = req.params.query;
    if (param === null || param === undefined || param === "") {
      res.status(400).send(
        responseObject({
          errorCode: ErrorCode.undefinedData,
          errorMessage: "Undefined query.",
        })
      );
      return;
    }

    let word = await retrieveFromDB(req, param);
    if (word == null) {
      await scrapeData(res, param, 1);
      word = await retrieveFromDB(req, param);
    }

    let words: Word[] = await WordModel.find({ word: { $regex: param } });
    words = words.filter((obj) => {
      if (word === null) return true;
      return obj.word !== word.word;
    });

    if (word !== null) {
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

    const pagination: Pagination = {
      currentPage: page,
      allPages: Math.ceil(
        Number(await WordModel.collection.countDocuments()) / pageSize
      ),
      pageSize: pageSize,
    };

    try {
      const words = await WordModel.find()
        .sort({ word: 1 })
        .skip(Page.beginAt(page, pageSize))
        .limit(pageSize);
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

    const user = (await UserModel.findOne({ jwsToken: token })) as User;

    if (user === undefined || user === null) {
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

    if (wordId == null || undefined || !wordId.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json(responseObject({ errorMessage: "Invalid id." }));
      return;
    }

    const objectId = new ObjectId(wordId);

    try {
      const wordDB = await wordFromId(objectId);

      if (wordDB !== null) {
        await WordModel.updateOne(
          { _id: objectId },
          {
            searchHits: updateSearchHits(wordDB),
          },
          { upsert: false }
        );

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
   *
   * @param req The request with a word param.
   * @param res The response with a single word.
   */
  export async function singleResult(req: Request, res: Response) {
    const page = Page.normalizedPage(req.params.page);
    const word = req.params.word;

    const resultDB = await retrieveFromDB(req, word);

    if (resultDB !== null) {
      res.status(200).send(responseObject({ data: resultDB }));
      return;
    }

    await scrapeData(res, word, page);
    const fromDB = await retrieveFromDB(req, word);
    if (fromDB !== null) res.status(200).send(responseObject({ data: fromDB }));
    else
      res.status(404).send(
        responseObject({
          errorMessage: "Not found",
          errorCode: ErrorCode.notFoundData,
        })
      );
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

    if (token === undefined || token === null || !ObjectId.isValid(wordId)) {
      return res.status(400).send(
        responseObject({
          data: false,
          errorMessage: "Token or wordId not valid.",
          errorCode: 400,
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
   * Adds searched word to the current user in the database.
   *
   * @param req The request.
   * @param word The word
   */
  async function addWordIdToCurrentUser(req: Request, word: string) {
    const token = req.headers["authorization"]?.split(" ")[1];

    if (token === undefined || token === null) return;

    await UserModel.updateOne(
      { jwsToken: token },
      { $addToSet: { wordIds: word } }
    );
  }

  /**
   * Tries to retrieve the word from the database.
   *
   * @param word The word from the query.
   * @returns `Promise<Word>` if found in DB, `Promise<null>` otherwise.
   */
  async function retrieveFromDB(req: Request, word: string) {
    try {
      const wordDB = await wordFromDB(req, word);

      if (wordDB !== null) {
        await WordModel.updateOne(
          { word: word },
          {
            searchHits: updateSearchHits(wordDB),
          },
          { upsert: false }
        );
        return wordDB;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Scrapes data from Termania and saves it to DB.
   *
   * @param word The word from query.
   * @param page The selected page.
   */
  async function scrapeData(res: Response, word: string, page: number) {
    const results: ResponseWithPagination[] = [];
    try {
      results.push(await scrapeTermania(word, page));
    } catch (e) {
      console.error(e);
    }

    let i = 0;

    while (i < results.length) {
      if (!Helpers.isNotLastPage(results[i].pagination)) break;
      try {
        const currentResult = await scrapeTermania(
          word,
          results[i].pagination.currentPage + 1
        );

        if (Helpers.isOnlySectionOthersInResponse(currentResult)) break;

        results.push(Helpers.responseWithoutSectionOthers(currentResult));
        i++;
        if (i > 2) break;
      } catch (e) {
        console.error(e);
        break;
      }
    }

    await saveWordsToDB(results);
  }

  /**
   *
   * @param word A word from query.
   * @returns `Promise<Word>` if found in DB, `Promise<null>` otherwise.
   */
  async function wordFromDB(req: Request, word: string) {
    try {
      const value = await WordModel.findOne({ word: { $regex: word } });
      if (value !== null) {
        addWordIdToCurrentUser(req, value?._id.toString());
        return value as Word;
      }
      return null;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  async function wordFromId(id: ObjectId) {
    try {
      const value = await WordModel.findOne({ _id: new ObjectId(id) });
      if (value !== null) return value as Word;
      return null;
    } catch (e) {
      console.error(e);
      return null;
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

/**
 * Helper functions for WordController.
 */
namespace Helpers {
  /**
   * @param pagination Pagination from the result.
   * @returns `True` if `currentPage` is less than `allPages`, `false` otherwise.
   */
  export const isNotLastPage = (pagination: Pagination) => {
    return pagination.currentPage < pagination.allPages;
  };

  /**
   *
   * @param currentResult The result from the response.
   * @returns The result without section `others`.
   */
  export const responseWithoutSectionOthers = (
    currentResult: ResponseWithPagination
  ): ResponseWithPagination => {
    return {
      allSections: filterSectionOthers(currentResult),
      pagination: currentResult.pagination,
    };
  };

  /**
   * @param currentResult The result from the response.
   * @returns `main` and `translate` sections if they exist, an empty array otherwise.
   */
  export const filterSectionOthers = (
    currentResult: ResponseWithPagination
  ) => {
    return currentResult.allSections.filter(
      (element) => element.section !== "others"
    );
  };

  /**
   * @param currentResult The result from the response.
   * @returns `True` if result has only section "others", `false` otherwise.
   */
  export const isOnlySectionOthersInResponse = (
    currentResult: ResponseWithPagination
  ) => {
    return filterSectionOthers(currentResult).length === 0;
  };
}

export default WordController;

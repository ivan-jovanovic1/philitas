import { Request, Response } from "express";
import { scrapeTermania } from "../scrape/termania/TermaniaScrape";
import { WordModel, Word, updateSearchHits } from "../models/Word";
import { UserModel, User } from "../models/User";
import { verify } from "jsonwebtoken";
import Translate from "../helpers/Translate";

import {
  Pagination,
  ResponseWithPagination,
} from "../scrape/termania/TermaniaModels";
export namespace WordController {
  export async function singleResult(req: Request, res: Response) {
    // If page param is not a number, set page value to 1 (the first page).
    const pageParam = Number(req.params.page);
    const page = Number.isNaN(pageParam) ? 1 : pageParam;

    const word = req.params.word;
    await addWordIdToCurrentuser(req, word);

    const resultDB = await retrieveFromDB(word);

    if (resultDB === null) {
      await scrapeData(res, word, page);
      res.json(await retrieveFromDB(word));
    } else res.json(resultDB);
  }

  async function addWordIdToCurrentuser(req: Request, word: string) {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (token === undefined) return;

    await UserModel.updateOne(
      { authToken: token },
      { $addToSet: { wordIds: word } }
    );
  }

  /**
   * Tries to retrieve a word from DB.
   *
   * @param word A word from query.
   * @returns `Promise<Word>` if found in DB, `Promise<null>` otherwise.
   */
  async function retrieveFromDB(word: string) {
    try {
      const wordDB = await wordFromDB(word);

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
   * @param response Express response.
   * @param word A word from query.
   * @param page Selected page.
   */
  async function scrapeData(response: Response, word: string, page: number) {
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
        console.log(`Next page: ${i}`);
        if (i > 10) break;
      } catch (e) {
        console.error(e);
        break;
      }
    }
    // response.json(results);

    await saveWordsToDB(results);
  }

  /**
   *
   * @param word A word from query.
   * @returns `Promise<Word>` if found in DB, `Promise<null>` otherwise.
   */
  async function wordFromDB(word: string) {
    try {
      const value = await WordModel.findOne({ word: { $regex: word } });
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

          const translation = await Translate.text(
            termaniaWord.word,
            termaniaWord.language
          );
          if (translation !== null) {
            word.translatedWord = translation;
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
   * @param currentResult A result from the response.
   * @returns Result without section `others`.
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
   * @param currentResult A result from the response.
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
   * @param currentResult A result from the response.
   * @returns `True` if result has only section "others", `false` otherwise.
   */
  export const isOnlySectionOthersInResponse = (
    currentResult: ResponseWithPagination
  ) => {
    return filterSectionOthers(currentResult).length === 0;
  };
}

export default WordController;

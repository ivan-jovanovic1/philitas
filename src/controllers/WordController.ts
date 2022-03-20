import { Request, Response } from "express";
import { scrapeTermania } from "../scrape/termania/TermaniaScrape";
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

    const results: ResponseWithPagination[] = [];

    try {
      const firstResult = results.push(await scrapeTermania(word, page));
      let i = 0;

      while (i < results.length) {
        if (!Helpers.isNotLastPage(results[i].pagination)) break;

        const currentResult = await scrapeTermania(
          word,
          results[i].pagination.currentPage + 1
        );

        if (Helpers.isOnlySectionOthersInResponse(currentResult)) break;

        results.push(Helpers.responseWithoutSectionOthers(currentResult));
        i++;
      }

      res.json(results);
    } catch (e) {
      console.error(e);
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

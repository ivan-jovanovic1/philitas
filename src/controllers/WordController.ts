import { Request, Response } from "express";
import { scrapeTermania, Pagination } from "../helpers/scrape/TermaniaScrape";
import { SectionResults, Word } from "../models/Word";
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
        if (!isNotLastPage(results[i].pagination)) break;

        const currentResult = await scrapeTermania(
          word,
          results[i].pagination.currentPage + 1
        );

        if (isOnlySectionOthersInResponse(currentResult)) break;

        results.push(filterSectionOthersFromResult(currentResult));
        i++;
      }

      res.json(results);
    } catch (e) {
      console.error(e);
    }
  }
}

const isNotLastPage = (pagination: Pagination) => {
  return pagination.currentPage < pagination.allPages;
};

const filterSectionOthersFromResult = (
  currentResult: ResponseWithPagination
): ResponseWithPagination => {
  return {
    allSections: filterSectionOthers(currentResult),
    pagination: currentResult.pagination,
  };
};

const filterSectionOthers = (currentResult: ResponseWithPagination) => {
  return currentResult.allSections.filter(
    (element) => element.section !== "others"
  );
};

const isOnlySectionOthersInResponse = (
  currentResult: ResponseWithPagination
) => {
  return filterSectionOthers(currentResult).length === 0;
};

export default WordController;

interface ResponseWithPagination {
  allSections: SectionResults[];
  pagination: Pagination;
}

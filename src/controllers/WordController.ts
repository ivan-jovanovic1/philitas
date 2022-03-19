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
      const value = await scrapeTermania(word, page);
      results.push(value);
      let i = 0;

      while (i < results.length) {
        if (isNotLastPage(results[i].pagination)) {
          const newValue = await scrapeTermania(
            word,
            results[i].pagination.currentPage + 1
          );

          results.push(newValue);
          console.log(i);
          console.log(results[i].pagination);

          i++;
          if (i > 5) break;
        }
      }

      res.json(results);

      // res.json(value);
    } catch (e) {
      console.error(e);
    }
  }

  const isNotLastPage = (pagination: Pagination) => {
    return pagination.currentPage < pagination.allPages;
  };
}

export default WordController;

interface ResponseWithPagination {
  allSections: SectionResults[];
  pagination: Pagination;
}

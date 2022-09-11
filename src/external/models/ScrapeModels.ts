import { Pagination } from "../../shared/Pagination";

interface TermaniaSectionResults {
  section: string;
  wordsWithExplanations: TermaniaWord[];
}

interface TermaniaWord {
  word: string;
  explanations: string[];
  dictionaryName: string;
  source: string;
  language: string;
}

interface ResponseWithPagination {
  allSections: TermaniaSectionResults[];
  pagination: Pagination;
}

export { TermaniaSectionResults, TermaniaWord, ResponseWithPagination };

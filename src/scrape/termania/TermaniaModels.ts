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
interface Pagination {
  currentPage: number;
  allPages: number;
}

interface ResponseWithPagination {
  allSections: TermaniaSectionResults[];
  pagination: Pagination;
}

export {
  TermaniaSectionResults,
  TermaniaWord,
  Pagination,
  ResponseWithPagination,
};

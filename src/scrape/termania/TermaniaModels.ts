interface SectionResults {
  section: string;
  wordsWithExplanations: Word[];
}

interface Word {
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
  allSections: SectionResults[];
  pagination: Pagination;
}

export { SectionResults, Word, Pagination, ResponseWithPagination };

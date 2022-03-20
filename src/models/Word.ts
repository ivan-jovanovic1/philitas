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

export { SectionResults, Word };

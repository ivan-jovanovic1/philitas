interface SectionResults {
  section: string;
  wordsWithExplanations: WordWithExplanation[];
}

interface WordWithExplanation {
  word: string;
  explanations: string[];
}

interface Word {
  word: string;
  explanations: string[];
  dictionaryName: string;
  source: string;
  language: string;
}

export { SectionResults, WordWithExplanation, Word };

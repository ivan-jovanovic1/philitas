import { TermaniaWord } from "../external/models/ScrapeModels";
import { Schema, model, CallbackError, SchemaType, Types } from "mongoose";

class DictionaryExplanation {
  explanations: string[];
  dictionaryName: string;
  source: string;

  constructor(explanations: string[], dictionaryName: string, source: string) {
    this.explanations = explanations;
    this.dictionaryName = dictionaryName;
    this.source = source;
  }
}

class SearchHit {
  hits: number;
  month: number;
  year: number;
  constructor() {
    const currentDate = new Date();
    this.hits = 1;
    this.month = currentDate.getMonth() + 1;
    this.year = currentDate.getFullYear();
  }
}

interface Translation {
  language: string;
  word: string;
}

class Word {
  word: string;
  language: string;
  dictionaryExplanations: DictionaryExplanation[];
  searchHits: SearchHit[];
  translations: Translation[];

  constructor(termania: TermaniaWord) {
    this.word = termania.word;
    this.dictionaryExplanations = [
      {
        explanations: termania.explanations,
        dictionaryName: termania.dictionaryName,
        source: termania.source,
      },
    ];
    this.language = termania.language;
    this.searchHits = [createSearchHit()];
    this.translations = [];
  }
}

const createSearchHit = () => {
  const date = new Date();
  return {
    hits: 1,
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  };
};

const updateSearchHits = (word: Word) => {
  const currentDate = new Date();
  let alreadyUpdated = false;
  // Try to find in existing months and years
  word.searchHits.forEach((searchHit, index) => {
    if (
      searchHit.month === currentDate.getMonth() + 1 &&
      searchHit.year === currentDate.getFullYear()
    ) {
      alreadyUpdated = true;
      word.searchHits[index].hits++;
    }
  });

  // If not found in existing months, add new month
  if (!alreadyUpdated) word.searchHits.push(createSearchHit());

  return word.searchHits;
};
interface Word {
  createSearchHit(): SearchHit;
  updateSearchHits(): SearchHit[];
  updateWordUsingTermaniaModel(word: TermaniaWord): void;
  isSameWord(word: TermaniaWord): boolean;
}

const wordSchema = new Schema<Word>({
  word: { type: String, required: true },
  dictionaryExplanations: {
    type: [] as DictionaryExplanation[],
    required: true,
  },
  language: { type: String, required: true },
  //   isVerified: { type: Boolean, required: true },
  searchHits: { type: [] as SearchHit[], required: false },
  translations: { type: [] as Translation[], required: true },
});

const WordModel = model<Word>("Word", wordSchema);

export { WordModel, Word, Translation, updateSearchHits };

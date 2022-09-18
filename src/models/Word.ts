import { TermaniaWord } from "../external/models/ScrapeModels";
import { Schema, model } from "mongoose";
import { v4 as uuid } from "uuid";

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

interface Translation {
  language: string;
  word: string;
}

class Word {
  word: string;
  language: string;
  dictionaryExplanations: DictionaryExplanation[];
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
    this.translations = [];
  }
}
interface Word {
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
  translations: { type: [] as Translation[], required: true },
});

const WordModel = model<Word>("Word", wordSchema);

export { WordModel, Word, Translation };

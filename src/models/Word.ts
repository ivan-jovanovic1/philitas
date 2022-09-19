import { TermaniaWord } from "../external/models/ScrapeModels";
import { Schema, model } from "mongoose";
import { ObjectId } from "mongodb";

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
  _id: ObjectId;
  name: string;
  language: string;
  translation: Translation | null;

  constructor(name: string, language: string, translation: Translation | null) {
    this._id = new ObjectId();
    this.name = name;
    this.language = language;
    this.translation = translation;
  }
}
interface Word {
  updateWordUsingTermaniaModel(word: TermaniaWord): void;
  isSameWord(word: TermaniaWord): boolean;
}

const wordSchema = new Schema<Word>({
  _id: { type: ObjectId, required: true },
  name: { type: String, required: true },
  language: { type: String, required: true },
  translation: { type: {} as Translation, required: false },
});

const WordModel = model<Word>("Word", wordSchema);

export { WordModel, Word, Translation };

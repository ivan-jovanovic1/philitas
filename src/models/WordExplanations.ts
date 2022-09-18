import { Schema, model } from "mongoose";

class Dictionary {
  explanations: string[];
  dictionaryName: string;
  source: string;
  /// This property represents only word itself. Explanations are always in Slovene.
  wordLanguage: string;

  constructor(
    explanations: string[],
    dictionaryName: string,
    source: string,
    wordLanguage: string
  ) {
    this.explanations = explanations;
    this.dictionaryName = dictionaryName;
    this.source = source;
    this.wordLanguage = wordLanguage;
  }
}

class WordExplanations {
  wordId: string;
  dictionaries: Dictionary[];
  constructor(wordId: string, dictionaries: Dictionary[]) {
    this.wordId = wordId;
    this.dictionaries = dictionaries;
  }
}

let wordExplanationsSchema = new Schema<WordExplanations>({
  wordId: { type: String, required: true },
  dictionaries: { type: [] as Dictionary[], required: true },
});

const WordExplanationsModel = model<WordExplanations>(
  "WordExplanations",
  wordExplanationsSchema
);

export { WordExplanationsModel, WordExplanations, Dictionary };

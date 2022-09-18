import {
  Dictionary,
  WordExplanations,
  WordExplanationsModel,
} from "../models/WordExplanation";
export namespace WordExplanationService {
  export const list = async (wordId: string) => {
    const modelDB = await WordExplanationsModel.findOne({ wordId: wordId });
    if (!modelDB) {
      return [];
    }
    return (modelDB as WordExplanations).dictionaries;
  };

  export const add = async (wordId: string, dictionaries: Dictionary[]) => {
    const modelDB = await WordExplanationsModel.findOne({ wordId: wordId });
    if (!modelDB) {
      const model = new WordExplanationsModel(
        new WordExplanations(wordId, dictionaries)
      );
      await model.save();
      return;
    }

    await WordExplanationsModel.updateOne(
      { wordId: wordId },
      { $addToSet: { dictionaries: dictionaries } }
    );
  };
}

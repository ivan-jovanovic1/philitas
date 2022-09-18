import { ObjectId } from "mongoose";
import { UserModel } from "../models/User";
import { WordModel, Word } from "../models/Word";
import { Page, Pagination } from "../shared/Pagination";

export namespace FavoriteWordService {
  export const pagination = async (
    page: number,
    pageSize: number,
    wordIds: string[]
  ): Promise<Pagination> => {
    return {
      currentPage: page,
      allPages: Math.ceil(
        Number(
          await WordModel.collection.countDocuments({
            _id: { $in: wordIds },
          })
        ) / pageSize
      ),
      pageSize: pageSize,
    };
  };

  export const wordList = async (
    currentPage: number,
    pageSize: number,
    wordIds: string[]
  ) => {
    return (await WordModel.find({ _id: { $in: wordIds } })
      .sort({ mainLanguge: -1, word: 1 })
      .skip(Page.beginAt(currentPage, pageSize))
      .limit(pageSize)) as Word[];
  };

  export const update = async (
    wordId: string,
    remove: Boolean,
    token: string
  ) => {
    if (remove) {
      await UserModel.updateOne(
        { jwsToken: token },
        { $pull: { favoriteWordIds: wordId } }
      );
    } else {
      await UserModel.updateOne(
        { jwsToken: token },
        { $addToSet: { favoriteWordIds: wordId } }
      );
    }
  };
}

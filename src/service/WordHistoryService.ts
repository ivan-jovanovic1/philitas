import { WordModel, Word } from "../models/Word";
import { UserHistory, UserHistoryModel } from "../models/UserHistory";
import { Page, Pagination } from "../shared/Pagination";

export namespace WordHistoryService {
  export const pagination = async (
    page: number,
    pageSize: number,
    userId: string
  ): Promise<Pagination> => {
    return {
      currentPage: page,
      allPages: Math.ceil(
        Number(
          await UserHistoryModel.collection.countDocuments({
            _id: userId,
          })
        ) / pageSize
      ),
      pageSize: pageSize,
    };
  };

  export const wordList = async (
    currentPage: number,
    pageSize: number,
    userId: string
  ) => {
    const history = (await UserHistoryModel.findOne({ userId: userId })
      .skip(Page.beginAt(currentPage, pageSize))
      .limit(pageSize)) as UserHistory;

    if (history.wordIds.length === 0) {
      return [];
    }

    return (await WordModel.find({
      _id: { $in: history.wordIds },
    })
      .collation({ locale: "sl" })
      .sort({ name: 1 })) as Word[];
  };

  export const remove = async (wordId: string, userId: string) => {
    await UserHistoryModel.updateOne(
      { userId: userId },
      { $pull: { wordIds: wordId } }
    );
  };

  export const numberOfWords = async (userId: string) => {
    const modelDB = await UserHistoryModel.findOne({ userId: userId });
    if (modelDB) {
      return (modelDB as UserHistory).wordIds.length;
    }
    return 0;
  };

  export const add = async (wordId: string, userId: string) => {
    const v = await UserHistoryModel.findOne({ userId: userId });

    if (!v) {
      const modelDB = new UserHistoryModel(new UserHistory(userId, [wordId]));
      await modelDB.save();
    } else {
      const value = await UserHistoryModel.updateOne(
        { userId: userId },
        { $addToSet: { wordIds: wordId } }
      );
    }
  };
}

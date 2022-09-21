import { UserModel } from "../models/User";
import { WordModel, Word } from "../models/Word";
import { UserFavorites, UserFavoritesModel } from "../models/UserFavorites";
import { Page, Pagination } from "../shared/Pagination";

export namespace FavoriteWordService {
  export const pagination = async (
    page: number,
    pageSize: number,
    userId: string
  ): Promise<Pagination> => {
    return {
      currentPage: page,
      allPages: Math.ceil(
        Number(
          await UserFavoritesModel.collection.countDocuments({
            userId: userId,
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
    const favorites = await UserFavoritesModel.findOne({ userId: userId })
      .skip(Page.beginAt(currentPage, pageSize))
      .limit(pageSize);

    if (!favorites) {
      return [];
    }

    return (await WordModel.find({
      _id: { $in: favorites.wordIds },
    }).sort({ mainLanguge: -1, word: 1 })) as Word[];
  };

  export const update = async (
    wordId: string,
    remove: Boolean,
    userId: string
  ) => {
    if (remove) {
      await UserFavoritesModel.updateOne(
        { userId: userId },
        { $pull: { wordIds: wordId } }
      );
    } else {
      const v = await UserFavoritesModel.findOne({ userId: userId });

      if (!v) {
        const modelDB = new UserFavoritesModel(
          new UserFavorites(userId, [wordId])
        );
        await modelDB.save();
      } else {
        const value = await UserFavoritesModel.updateOne(
          { userId: userId },
          { $addToSet: { wordIds: wordId } }
        );
      }
    }
  };

  export const numberOfWords = async (userId: string) => {
    const modelDB = await UserFavoritesModel.findOne({ userId: userId });
    if (modelDB) {
      return (modelDB as UserFavorites).wordIds.length;
    }
    return 0;
  };

  export const isFavorite = async (userId: string, wordId: string) => {
    const word = await UserFavoritesModel.findOne({
      userId: userId,
      wordIds: wordId,
    });
    return word !== null;
  };
}

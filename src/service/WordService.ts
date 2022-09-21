import { UserModel } from "../models/User";
import { WordModel, Word } from "../models/Word";
import { ObjectId } from "mongodb";
import { Page, Pagination } from "../shared/Pagination";

export namespace WordService {
  /**
   *
   * @param word A word from query.
   * @returns `Promise<Word>` if found in DB, `Promise<Error>` otherwise.
   */
  export async function wordFromDB(word: string): Promise<Word | null> {
    const resultDB = await WordModel.findOne({ name: { $regex: word } });
    return resultDB === null ? null : (resultDB as Word);
  }

  export async function wordFromId(id: ObjectId) {
    const value = await WordModel.findOne({ _id: id });
    if (value !== null) return value as Word;
    return null;
  }

  /**
   * Adds searched word to the current user in the database.
   *
   * @param token The authentication token of the current user.
   * @param wordId The word id.
   */
  export async function addWordIdToCurrentUser(token: string, wordId: string) {
    await UserModel.updateOne(
      { jwsToken: token },
      { $addToSet: { wordIds: wordId } }
    );
  }

  export async function allWordsPagination(
    page: number,
    pageSize: number
  ): Promise<Pagination> {
    const allPages = Math.ceil(
      Number(await WordModel.collection.countDocuments()) / pageSize
    );
    return {
      currentPage: page,
      allPages: allPages,
      pageSize: pageSize,
    };
  }

  export async function allWordsList(beginAtPage: number, pageSize: number) {
    return (await WordModel.find()
      .collation({ locale: "sl" })
      .sort({ name: 1 })
      .skip(Page.beginAt(beginAtPage, pageSize))
      .limit(pageSize)) as Word[];
  }
}

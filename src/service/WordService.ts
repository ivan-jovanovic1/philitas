import { UserModel } from "../models/User";
import { WordModel, Word, createSearchHit } from "../models/Word";
import { ResponseWithStatus } from "../models/BaseResponse";
import { ErrorCode } from "../models/ErrorCode";
import { ObjectId } from "mongodb";

export namespace WordService {
  /**
   *
   * @param word A word from query.
   * @returns `Promise<Word>` if found in DB, `Promise<Error>` otherwise.
   */
  export async function wordFromDB(word: string): Promise<ResponseWithStatus> {
    const resultDB = await WordModel.findOne({ word: { $regex: word } });
    const isNull = resultDB === null;
    return {
      statusCode: isNull ? 404 : 200,
      response: {
        errorCode: isNull ? ErrorCode.notFoundData : null,
        errorMessage: isNull ? "Not found in the database." : null,
        data: isNull ? null : (resultDB as Word),
      },
    };
  }

  export async function wordFromId(id: ObjectId) {
    const value = await WordModel.findOne({ _id: id });
    if (value !== null) return value as Word;
    return null;
  }

  export async function updateHits(word: Word) {
    await WordModel.updateOne(
      { word: word.word },
      {
        searchHits: processSearchHits(word),
      },
      { upsert: false }
    );
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

  function processSearchHits(word: Word) {
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
  }
}

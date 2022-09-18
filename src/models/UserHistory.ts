import { Schema, model } from "mongoose";

class UserHistory {
  userId: string;
  wordIds: string[];
  constructor(userId: string, wordIds: string[]) {
    this.userId = userId;
    this.wordIds = wordIds;
  }
}

let userFavoritesSchema = new Schema<UserHistory>({
  userId: { type: String, required: true },
  wordIds: { type: [String], required: true },
});

const UserHistoryModel = model<UserHistory>(
  "UserHistoryWords",
  userFavoritesSchema
);

export { UserHistoryModel, UserHistory };

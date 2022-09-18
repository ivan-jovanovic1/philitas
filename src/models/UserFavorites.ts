import { Schema, model } from "mongoose";

class UserFavorites {
  userId: string;
  wordIds: string[];
  constructor(userId: string, wordIds: string[]) {
    this.userId = userId;
    this.wordIds = wordIds;
  }
}

let userFavoritesSchema = new Schema<UserFavorites>({
  userId: { type: String, required: true },
  wordIds: { type: [String], required: true },
});

const UserFavoritesModel = model<UserFavorites>(
  "UserFavoriteWords",
  userFavoritesSchema
);

export { UserFavoritesModel, UserFavorites };

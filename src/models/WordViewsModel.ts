import { Schema, model } from "mongoose";

class ViewsPerMonth {
  hits: number;
  month: number;
  year: number;
  constructor() {
    const currentDate = new Date();
    this.hits = 1;
    this.month = currentDate.getMonth() + 1;
    this.year = currentDate.getFullYear();
  }
}

class WordViews {
  wordId: string;
  viewsPerMonth: ViewsPerMonth[];
  constructor(wordId: string, viewsPerMonth: ViewsPerMonth[]) {
    this.wordId = wordId;
    this.viewsPerMonth = viewsPerMonth;
  }
}

let userFavoritesSchema = new Schema<WordViews>({
  wordId: { type: String, required: true },
  viewsPerMonth: { type: [] as ViewsPerMonth[], required: true },
  //  wordIds: { type: [String], required: true },
});

const WordViewsModel = model<WordViews>("WordViews", userFavoritesSchema);

export { WordViewsModel, WordViews, ViewsPerMonth };

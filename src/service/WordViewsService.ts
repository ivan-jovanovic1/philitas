import {
  ViewsPerMonth,
  WordViews,
  WordViewsModel,
} from "../models/WordViewsModel";

export namespace WordViewsService {
  export const update = async (wordId: string) => {
    const valueDB = await WordViewsModel.findOne({ wordId: wordId });

    if (!valueDB) {
      const modelDB = new WordViewsModel(
        new WordViews(wordId, [new ViewsPerMonth()])
      );
      await modelDB.save();
      return;
    }
    const currentViewsPerMonth = (valueDB as WordViews).viewsPerMonth;
    await WordViewsModel.updateOne(
      { wordId: wordId },
      { viewsPerMonth: updatedViewsPerMonth(currentViewsPerMonth) },
      { upsert: false }
    );
  };

  const updatedViewsPerMonth = (viewsPerMonth: ViewsPerMonth[]) => {
    const currentDate = new Date();
    let alreadyUpdated = false;
    // Try to find in existing months and years
    viewsPerMonth.forEach((searchHit, index) => {
      if (
        searchHit.month === currentDate.getMonth() + 1 &&
        searchHit.year === currentDate.getFullYear()
      ) {
        alreadyUpdated = true;
        viewsPerMonth[index].hits++;
      }
    });
    // If not found in existing months, add new month

    if (!alreadyUpdated)
      viewsPerMonth.push({
        hits: 1,
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
      });

    return viewsPerMonth;
  };
}

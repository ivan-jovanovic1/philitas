import googleTranslate from "@iamtraction/google-translate";
import { Translation } from "../models/Word";

/**
 * Free Google Translate from Github repository: https://github.com/iamtraction/google-translate
 */
export namespace Translate {
  export async function anyLanguage(word: string, from: string, to: string) {
    try {
      return {
        language: to,
        word: (await googleTranslate(word, { from: from, to: to })).text,
      };
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  /**
   *
   * @param word The word in its main language.
   * @param from The origin languge.
   * @returns Translation in English if the origin language is Slovene, otherwise translation in Slovene.
   */
  export async function englishSloveneInvertible(
    word: string,
    from: string
  ): Promise<Translation | null> {
    const to = from == "sl" ? "en" : "sl";
    try {
      return {
        language: to,
        word: (await googleTranslate(word, { to: to })).text,
      };
    } catch (e) {
      console.error(e);
      return null;
    }
  }
}

export default Translate;

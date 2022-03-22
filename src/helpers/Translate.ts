import googleTranslate from "@iamtraction/google-translate";

/**
 * Free Google Translate from Github repository: https://github.com/iamtraction/google-translate
 */
export namespace Translate {
  export async function text(word: string, from: string) {
    const to = from === "sl" ? "en" : "sl";
    try {
      return (await googleTranslate(word, { from: from, to: to })).text;
    } catch (e) {
      console.error(e);
      return null;
    }
  }
}

export default Translate;

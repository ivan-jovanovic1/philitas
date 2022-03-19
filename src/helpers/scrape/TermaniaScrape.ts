import request from "request";
import cheerio from "cheerio";
import util from "util";
import { SectionResults, Word } from "../../models/Word";
import { removeDiacritics } from "../RemoveDiactritis";

/**
 * Main function that scrapes data from termania.net.
 *
 * @param word Query word.
 * @param page Current page
 * @returns Resolved promise of words with explanations if succeeds, rejected promise with error otherwise.
 */
const scrapeTermania = (word: string, page: number = 1) => {
  const url = `https://www.termania.net/iskanje?ld=58&ld=122&query=${word}&page=${page}&SearchIn=Linked`;
  return new Promise(
    (
      resolve: (value: {
        allSections: SectionResults[];
        pagination: Pagination;
      }) => void,
      reject: (value: Error) => void
    ) => {
      request(encodeURI(url), (error, response, html) => {
        if (!error && response.statusCode === 200) {
          const cheerioAPI = cheerio.load(html);

          /// Grabs all children list-result with div tag.
          const elements = cheerioAPI(
            'div[id="list-results"] > div, ul'
          ).toArray();

          let allSections: SectionResults[] = [];
          let pagination: Pagination = { currentPage: 1, allPages: 1 };

          // Current section.
          let section = "";

          // Processes sections, words with explanations and pagination.
          for (const element of elements) {
            if (
              isTagElement(element) &&
              element.attribs.class === "page-header" &&
              isTagElement(element.children[1])
            ) {
              section = determineSection(element.children[1]);
            }

            if (
              isTagElement(element) &&
              element.attribs.class === "list-group results"
            ) {
              const results = processResults(element, section, word, url);
              allSections.push(results);
            }

            if (
              isTagElement(element) &&
              element.attribs.class === "pagination"
            ) {
              pagination = processPagination(element);
            }
          }

          // console.log(
          //   util.inspect(allSections, false, null, true /* enable colors */)
          // );
          // console.log(
          //   util.inspect(pagination, false, null, true /* enable colors */)
          // );

          resolve({ allSections, pagination });

          return { allSections, pagination };
        } else {
          console.log(`Error ${error} and resppnse ${response}`);
          reject(error);
        }
      });
    }
  );
};

/**
 * Processes single section.
 *
 * @param group List of elements in section .
 * @param section Current section.
 * @param word Word from query.
 * @param url URL with query.
 * @returns Section with words and explanations.
 */
const processResults = (
  group: cheerio.TagElement,
  section: string,
  word: string,
  url: string
): SectionResults => {
  let results: SectionResults = {
    section: section,
    wordsWithExplanations: [],
  };

  for (const el of group.children) {
    if (isTagElement(el) && el.attribs !== undefined) {
      let newElement: Word | null = null;

      if (isTagElement(el.children[1])) {
        newElement = processSingleElement(el.children[1], word, section, url);
      }

      // a word may be divided in more than one "block" if the word has different meanings (e.g. word "Mean")
      // flag alreadyExists guarantees that the same word won't be pushed to another object of type Word.
      // Instead its explanations will be added to the existing object of type Word.
      let alreadyExists = false;

      for (let i = 0; i < results.wordsWithExplanations.length; i++) {
        if (
          newElement !== null &&
          results.wordsWithExplanations[i].word === newElement.word
        ) {
          for (const explanation of newElement.explanations) {
            results.wordsWithExplanations[i].explanations.push(explanation);
          }

          alreadyExists = true;
          break;
        }
      }

      if (!alreadyExists && newElement !== null)
        results.wordsWithExplanations.push(newElement);
    }
  }

  return results;
};

/**
 *
 * @param element Section element.
 * @returns String which represents section identifier if succeeds, "unknown" otherwise.
 *
 */
const determineSection = (element: cheerio.TagElement) => {
  let section = "";
  if (isTextElement(element.children[0])) {
    const sectionData = element.children[0].data;
    section = sectionData !== undefined ? sectionData : "";
  }

  // word in some other language (not SI), usually in EN
  if (section.includes("PREVODIH")) {
    return "translate";
  }

  // other word which contains main word in its explanation
  if (section.includes("DRUGI VSEBINI")) {
    return "others";
  }

  // the same word as the search query
  if (section.includes("IZTOČNICAH")) {
    return "main";
  }

  return "unknown";
};

const processSingleElement = (
  element: cheerio.TagElement,
  wordName: string,
  section: string,
  source: string
) => {
  let oneResult: Word = {
    word: "",
    explanations: [],
    dictionaryName: "",
    source,
    language: "",
  };

  // word main language
  // this determines if word itself is shown in EN (computer), SL(računalnik)...
  // NOTE: explanations are always in SI
  const mainLanguage =
    isTagElement(element.children[1]) &&
    element.children[1].children[0].data !== undefined
      ? element.children[1].children[0].data
      : "";

  // check if data is from main section
  const isMainSection = section === "main";

  // get dictionary name without "Vir: " prefix
  oneResult.dictionaryName = dictionaryFromElement(element);

  oneResult.word = isMainSection ? removeDiacritics(wordName) : "";
  oneResult.language = mainLanguage;

  if (mainLanguage === "sl" && !isMainSection)
    oneResult.word = wordFromElement(element);

  if (
    isTagElement(element.children[5]) &&
    isTagElement(element.children[5].children[0])
  ) {
    // get word from explanations if current section is not the main section
    // and word language is not SL
    if (!isMainSection) oneResult.word = wordFromElement(element);

    for (const child of element.children[5].children[0].children) {
      if (!isTagElement(child)) continue;

      if (child.name === "strong" && child.children[0].data !== undefined) {
        oneResult.explanations.push(child.children[0].data);
      }
    }
  }

  return oneResult;
};

/// returns current page and number of all pages
const processPagination = (pagination: cheerio.TagElement) => {
  var paginationResult = {
    currentPage: 1,
    allPages: 1,
  };

  for (const child of pagination.children) {
    if (!isTagElement(child) || child.name !== "li") continue;

    const foundedPage =
      isTagElement(child.children[0]) &&
      isTagElement(child.children[0].children[0]) &&
      child.children[0].children[0].data !== undefined
        ? Number(child.children[0].children[0].data)
        : Number.NaN;

    if (isNaN(foundedPage)) continue;

    const foundedPageNumber = Number(foundedPage);

    /// current page
    if (child.attribs.class === "active") {
      paginationResult.currentPage = foundedPageNumber;
      continue;
    }

    /// if page is not marked as "active", try to update to new number of pages
    paginationResult.allPages = Math.max(
      paginationResult.allPages,
      foundedPageNumber
    );
  }

  return paginationResult;
};

/**
 *
 * @param element A word with explanations, dictionary name...
 * @returns The word without diacritis if found, empty string otherwise.
 * @see removeDiacritics function.
 */
const wordFromElement = (element: any) => {
  if (element.children[3].children[0].data !== undefined)
    return removeDiacritics(element.children[3].children[0].data);

  return "";
};

/**
 *
 * @param element A word with explanations, dictionary name...
 * @returns Dictionary name without prefix "Vir: " if found, empty string otherwise.
 */
const dictionaryFromElement = (element: any) => {
  if (isTextElement(element.children[7].children[0])) {
    const dict = element.children[7].children[0].data;
    return dict !== undefined ? dict.replace("Vir: ", "") : "";
  }
  return "";
};

/**
 * Tries to cast element of type "any" to type cheerio.TagElement
 * @param element Any value that is potentially cheerio.TagElement from cheerio
 */
const isTagElement = (element: any): element is cheerio.TagElement => {
  return element?.attribs !== undefined;
};

/**
 * * Tries to cast element of type "any" to type cheerio.TextElement
 * @param element Any value that is potentially cheerio.TextElement from cheerio
 */
const isTextElement = (element: any): element is cheerio.TextElement => {
  return element?.type === "text";
};

interface Pagination {
  currentPage: number;
  allPages: number;
}

export { scrapeTermania, Pagination };

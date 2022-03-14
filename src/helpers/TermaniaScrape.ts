import request from "request";
import cheerio from "cheerio";
import util from "util";

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

          /// grab all children list-result with div tag
          const elements = cheerioAPI(
            'div[id="list-results"] > div, ul'
          ).toArray();

          let allSections: SectionResults[] = [];
          let pagination: Pagination = { currentPage: 1, allPages: 1 };

          let section = "";

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
              //   console.log("\nWord object");
            }

            if (
              isTagElement(element) &&
              element.attribs.class === "pagination"
            ) {
              pagination = processPagination(element);
            }
          }

          console.log(
            util.inspect(allSections, false, null, true /* enable colors */)
          );
          console.log(
            util.inspect(pagination, false, null, true /* enable colors */)
          );

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
      const newElement = processSingleElement(el, word, section, url);
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

// determine word section
const determineSection = (element: cheerio.TagElement) => {
  let section = "";
  if (isTagElement(element.children[1])) {
    const sectionData = element.children[1].children[0].data;
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
  };

  if (!isTagElement(element.children[1])) return null;
  // word main language
  // this determines if word itself is shown in EN (computer), SL(računalnik)...
  // NOTE: explanations are always in SI
  const mainLanguage =
    isTagElement(element.children[1].children[1]) &&
    element.children[1].children[1].children[0].data !== undefined
      ? element.children[1].children[1].children[0].data
      : "";

  // check if data is from main section
  const isMainSection = section === "main";

  // get dictionary name without "Vir: " prefix
  oneResult.dictionaryName =
    isTagElement(element.children[1].children[7]) &&
    isTagElement(element.children[1].children[7].children[0]) &&
    element.children[1].children[7].children[0].data != undefined
      ? element.children[1].children[7].children[0].data.replace("Vir: ", "")
      : "";

  oneResult.word = isMainSection ? wordName : "";

  //   var oneResult = {
  //     word: isMainSection ? wordName : "", // we have reference to word from query only in main section
  //     explanations: [],
  //     dictionaryName,
  //     source,
  // wordDetailsLink: wordDetails,
  // mainLanguage: mainLanguage,
  // mainLanguageTitle: mainLanguageTitle,
  //   };

  // get word from explanations if current section is not the main section
  // and main language is SL
  if (mainLanguage === "sl" && !isMainSection) {
    oneResult.word =
      isTagElement(element.children[1]) &&
      isTagElement(element.children[1].children[3]) &&
      isTagElement(element.children[1].children[3].children[0]) &&
      element.children[1].children[3].children[0].data !== undefined
        ? element.children[1].children[3].children[0].data
        : "";
  }

  //   if (mainLanguage === "sl" && explanationInTitle !== word) {
  //     oneResult.explanations.push(explanationInTitle);
  //   }

  if (
    isTagElement(element.children[1].children[5]) &&
    isTagElement(element.children[1].children[5].children[0])
  )
    for (const child of element.children[1].children[5].children[0].children) {
      if (!isTagElement(child)) continue;

      if (mainLanguage !== "sl" && !isMainSection) {
        // get word from explanations if current section is not the main section
        // and word language is not SL
        oneResult.word =
          child.children[0].data !== undefined ? child.children[0].data : "";
      }
      if (child.name === "strong" && child.children[0].data !== undefined) {
        oneResult.explanations.push(child.children[0].data);
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

const isTagElement = (element: any): element is cheerio.TagElement => {
  return element?.attribs !== undefined;
};

interface SectionResults {
  section: string;
  wordsWithExplanations: WordWithExplanation[];
}

interface WordWithExplanation {
  word: string;
  explanations: string[];
}

interface Word {
  word: string;
  explanations: string[];
  dictionaryName: string;
  source: string;
}

interface Pagination {
  currentPage: number;
  allPages: number;
}

export {
  scrapeTermania,
  SectionResults,
  WordWithExplanation,
  Word,
  Pagination,
};

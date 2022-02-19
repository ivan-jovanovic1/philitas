import request from "request";
import { load } from "cheerio";
import { inspect } from "util";

request(
  encodeURI(
    "https://www.termania.net/iskanje?ld=58&query=beseda&page=1&SearchIn=Linked"
  ),
  (error, response, html) => {
    // request(encodeURI('https://www.termania.net/iskanje?query=računalnik&SearchIn=All&dictionaries=122'), (error, response, html) => {
    if (!error && response.statusCode === 200) {
      const cheerioAPI = load(html);

      /// grab all children list-result with div tag
      const elements = cheerioAPI('div[id="list-results"] > div, ul').toArray();

      var finalResult = {
        allSections: [],
        pagination: {
          currentPage: 1,
          allPages: 1,
        },
      };

      var section = "";

      for (const element of elements) {
        if (element.attribs.class === "page-header") {
          section = determineSection(element.children[1].children[0].data);
        }

        if (element.attribs.class === "list-group results") {
          const results = processResults(element, section);
          finalResult.allSections.push(results);
          //   console.log("\nWord object");
        }

        if (element.attribs.class === "pagination") {
          finalResult.pagination = processPagination(element);
        }
      }

      console.log(inspect(finalResult, false, null, true /* enable colors */));
    } else {
      console.log(`Error ${error} and resppnse ${response}`);
    }
  }
);

const processResults = (group, section) => {
  var results = {
    section: section,
    wordsWithExplanations: [],
  };

  for (const el of group.children) {
    if (el.attribs !== undefined) {
      const newElement = processSingleElement(el);
      results.wordsWithExplanations.push(newElement);
    }
  }

  return results;
};

const determineSection = (data) => {
  if (data.includes("PREVODIH")) {
    return "translate";
  } else if (data.includes("DRUGI VSEBINI")) {
    return "others";
  } else if (data.includes("IZTOČNICAH")) {
    return "main";
  }
};

const processSingleElement = (element) => {
  const wordDetails = element.children[1].attribs.href;
  const mainLanguage = element.children[1].children[1].children[0].data;
  const mainLanguageTitle = element.children[1].children[3].children[0].data;
  var oneResult = {
    localLanguage: "",
    explanations: [],
    wordDetailsLink: wordDetails,
    mainLanguage: mainLanguage,
    mainLanguageTitle: mainLanguageTitle,
  };

  for (const child of element.children[1].children[5].children[0].children) {
    if (child.name === "span") {
      oneResult.localLanguage = child.children[0].data;
    }
    if (child.name === "strong") {
      oneResult.explanations.push(child.children[0].data);
    }
  }

  return oneResult;
};

const processPagination = (pagination) => {
  var paginationResult = {
    currentPage: 1,
    allPages: 1,
  };

  var allPages = 1;

  for (const child of pagination.children) {
    if (child.name !== "li") continue;

    const foundedPage = child.children[0].children[0].data;

    if (isNaN(foundedPage)) continue;

    const foundedPageNumber = Number(foundedPage);

    if (child.attribs.class === "active") {
      paginationResult.currentPage = foundedPageNumber;
      continue;
    }

    if (paginationResult.allPages < foundedPageNumber) {
      paginationResult.allPages = foundedPageNumber;
    }
  }

  return paginationResult;
};

import { XMLParser } from "fast-xml-parser";

import fetch, { AbortError } from "node-fetch";
import { FETCH_TIMEOUT, MAX_NEWS_PER_REQUEST } from "../constants.js";
import {
  getAllCategories,
  normalizeCategories,
  parseCharsetFromContentType,
} from "./utils.js";

export const getRSSInfo = async (url) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, FETCH_TIMEOUT);

  const response = await fetch(url, { signal: controller.signal })
    .catch((e) => {
      if (e instanceof AbortError) {
        throw new Error("timeout");
      }
    })
    .finally(() => {
      clearTimeout(timeout);
    });
  const coding = parseCharsetFromContentType(
    response.headers.get("content-type")
  );
  const arrayBuffer = await response.arrayBuffer();
  const decoder = new TextDecoder(coding);
  const textDecoded = decoder.decode(arrayBuffer);
  const parser = new XMLParser({
    ignoreAttributes: false,
  });
  const result = parser.parse(textDecoded);
  return {
    title: result.rss.channel.title,
    link: url,
    time: Date.now(),
    categories: getAllCategories(result),
  };
};

const fixDescription = (description) => {
  if (!description) {
    return "";
  }
  const fixedDescription = description.replace(/<[^>]*>?/gm, "");
  if (fixedDescription > 2200) fixedDescription.slice(0, 2200).concat("...");
  return fixedDescription;
};

export const getLastArticles = async (url) => {
  const response = await fetch(url);
  const coding = parseCharsetFromContentType(
    response.headers.get("content-type")
  );
  const arrayBuffer = await response.arrayBuffer();
  const decoder = new TextDecoder(coding);
  const textDecoded = decoder.decode(arrayBuffer);
  const parser = new XMLParser({
    ignoreAttributes: false,
  });

  const result = parser.parse(textDecoded);
  const news = result?.rss?.channel?.item;
  return news
    .map(({ category, title, description, link, pubDate, enclosure }) => {
      const fixedDescription = fixDescription(description);
      return {
        text: `<b>${title}</b>${
          fixedDescription ? "\n\n" : ""
        }${fixedDescription}`,
        category: normalizeCategories(category),
        link,
        time: new Date(pubDate).getTime(),
        image: enclosure?.["@_url"],
      };
    })
    .slice(0, MAX_NEWS_PER_REQUEST);
};

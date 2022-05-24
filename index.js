import { dbApi } from "./mongodb.js";
import { startBot } from "./telegram.js";
import { getLastArticles } from "./services/rss.js";

import { handleData, startMonitoring } from "./services/utils.js";
import {NEWS_INTERVAL} from "./constants.js";

export const monitorings = new Map();

const main = async () => {
  await dbApi.start();
  const news = await dbApi.getAllRss();

  await startBot();

  for (const newsItem of news) {
    console.log(`Start monitoring ${newsItem.title}`);
    const { clear, link } = await startMonitoring({
      onData: handleData,
      getLastArticles,
      interval: NEWS_INTERVAL,
      link: newsItem.link,
    });
    monitorings.set(link, clear);
  }
};

main();

import { dbApi } from "./mongodb.js";
import { startBot } from "./telegram.js";
import { getLastArticles } from "./services/rss.js";

import { handleData, startMonitoring } from "./services/utils.js";
import { NEWS_INTERVAL } from "./constants.js";
import { setMapLanguages } from "./language/helper.js";

export const monitorings = new Map();
export const usersLanguages = new Map();

const INSERT_OP = "insert";
const DELETE_OP = "delete";

const main = async () => {
  await dbApi.start();
  const news = await dbApi.getAllRss();

  await setMapLanguages(usersLanguages);
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

  await dbApi.handleNewsUpdate(async (changes) => {
    if (![INSERT_OP, DELETE_OP].includes(changes.operationType)) {
      return;
    }
    if (changes.operationType === INSERT_OP) {
      console.log(`Start monitoring RSS: ${changes.fullDocument.title}`);
      const { clear, link } = await startMonitoring({
        onData: handleData,
        getLastArticles,
        interval: NEWS_INTERVAL,
        link: changes.fullDocument.link,
      });
      monitorings.set(link, clear);
    } else if (changes.operationType === DELETE_OP) {
      const link = changes.documentKey._id;
      const clearMonitoring = monitorings.get(link);
      clearMonitoring?.();
      monitorings.delete(link);
    }
  });
};

main();

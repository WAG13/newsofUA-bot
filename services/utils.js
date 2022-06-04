import { dbApi } from "../mongodb.js";
import { sendArticleMessage } from "../telegram.js";

const DEFAULT_INTERVAL = 10_000;

export const parseCharsetFromContentType = (contentType) => {
  return contentType?.match(/charset=([^;]+)/)?.[1] || "utf-8";
};

export const normalizeCategories = (categories) => {
  if (!categories) {
    return [];
  }
  if (!Array.isArray(categories)) {
    return [categories];
  }

  return [
    ...new Set(
      categories
        .map((x) => x.split("|"))
        .flat()
        .map((x) => x.trim())
        .filter(Boolean)
    ),
  ];
};

export const getAllCategories = (data) => {
  return normalizeCategories(
    data?.rss?.channel?.item
      .map((x) => x.category)
      .flat()
      .filter((x) => x)
  );
};

export const handleData = async (newArticles, link) => {
  const news = await dbApi.getAllRss();
  const subscribedUsers = await dbApi.getAllUsersWithSelectedNews(link);
  newArticles.forEach((newArticle) => {
    subscribedUsers.forEach((user) => {
      if (user.isPause) {
        return;
      }
      const newsPortal = news.find((x) => x.link === link);
      const userNewsCategories =
        user.news.find((x) => x.link === link)?.categories || [];

      if (
        newsPortal.categories.length === 0 ||
        newArticle.category.some((x) => userNewsCategories.includes(x))
      ) {
        sendArticleMessage({
          userId: user._id,
          article: newArticle,
          site: newsPortal.title,
          category: newArticle.category,
        });
      }
    });
  });
};

export const startMonitoring = async ({
  interval = DEFAULT_INTERVAL,
  onData,
  link,
  getLastArticles,
}) => {
  const news = await dbApi.getAllRss();
  let lastArticle = news.find((x) => x.link === link);

  const getArticleInterval = async () => {
    let allArticles;
    try {
      allArticles = await getLastArticles(link);
    } catch (e) {
      console.log(e, "Error when fetching last articles");
      return;
    }
    if (!lastArticle?.time) {
      lastArticle = allArticles[0];
      await dbApi.updateLastArticleTime(link, lastArticle?.time);
      onData([allArticles[0]], link);
      return;
    }
    const newArticles = allArticles.filter(
      (article) => article.time > lastArticle.time
    );
    if (newArticles.length === 0) {
      return;
    }
    lastArticle = newArticles[0];
    await dbApi.updateLastArticleTime(link, lastArticle?.time);
    onData(newArticles, link);
  };
  const intervalId = setInterval(getArticleInterval, interval);
  await getArticleInterval();
  return {
    clear: () => {
      clearInterval(intervalId);
    },
    link,
  };
};

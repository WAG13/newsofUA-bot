import { MongoClient } from "mongodb";
import { RSS_STATUSES } from "./telegram/constants.js";

const url = "mongodb+srv://user:user@cluster0.twnzn.mongodb.net/test";
const client = new MongoClient(url);

const dbName = "news";

export const dbApi = {
  async start() {
    this.db = client.db(dbName);
    this.collection = this.db.collection("news");
    this.users = this.db.collection("users");
    await client.connect();
  },

  async handleNewsUpdate(handler) {
    this.collection.watch().on("change", handler);
  },

  async addRSS({
    rssInfo: rss,
    isAdmin = false,
    isPrivate = false,
    users = [],
  }) {
    const currentRss = await this.collection.findOne({ _id: rss.link });
    if (!currentRss) {
      await this.collection.insertOne({
        _id: rss.link,
        ...rss,
        isPrivate,
        users,
      });

      await this.addUserNews(users?.[0], rss.link);
      return { rss: currentRss, status: RSS_STATUSES.INSERTED };
    }
    if (currentRss.isPrivate) {
      if (isAdmin) {
        await this.collection.updateOne(
          { _id: rss.link },
          { $set: { isPrivate: false } }
        );
        return { rss: currentRss, status: RSS_STATUSES.UPDATED };
      }

      if (currentRss.users.some((x) => users.includes(x))) {
        return { rss: currentRss, status: RSS_STATUSES.EXIST };
      }
      const newUsers = new Set([...currentRss.users, ...users]);
      await this.collection.updateOne(
        {
          _id: rss.link,
        },
        { $set: { users: [...newUsers.values()] } }
      );
      await this.addUserNews(users?.[0], rss.link);
      return { rss: currentRss, status: RSS_STATUSES.UPDATED };
    }

    return { rss: currentRss, status: RSS_STATUSES.EXIST };
  },

  async getRSSInfo(link) {
    return await this.collection.findOne({ _id: link });
  },
  async getAllRss() {
    return await this.collection.find({}).toArray();
  },
  async getAllRssWithCategories() {
    const res = await this.getAllRss();
    return res.filter((y) => y.categories.length > 1);
  },

  async getAdminIds() {
    return (await this.users.find({}).toArray())
      .filter((user) => user.isAdmin)
      .map((user) => user._id);
  },

  async removeRSS({ rss, isAdmin = false, userId }) {
    const currentRss = await this.collection.findOne({ _id: rss.link });
    if (!isAdmin && !currentRss.users.includes(userId)) {
      return { rss, status: RSS_STATUSES.NOT_ALLOWED };
    }

    const newUsers = currentRss.users.filter((x) => x !== userId);
    if (isAdmin || (newUsers.length === 0 && rss.isPrivate)) {
      await this.collection.deleteOne({
        _id: rss._id,
      });
      await this.removeUserNews(userId, rss.link);
      return { rss, status: RSS_STATUSES.REMOVED };
    }
    await this.collection.updateOne(
      { _id: rss._id },
      { $set: { users: newUsers } }
    );
    await this.removeUserNews(userId, rss.link);
    return { rss, status: RSS_STATUSES.UPDATED };
  },

  async removeUserNews(userId, newsId) {
    const user = await this.getUser(userId);
    user.news = user.news.filter((x) => x.link !== newsId);
    await this.users.updateOne({ _id: userId }, { $set: { news: user.news } });
  },

  async addUserNews(userId, newsId) {
    if (!userId) {
      return;
    }
    const user = await this.getUser(userId);
    const news = await this.getNews(newsId);
    user.news.push(news);
    await this.users.updateOne({ _id: userId }, { $set: { news: user.news } });
  },

  async getUser(userId) {
    return (await this.users.findOne({ _id: userId })) || {};
  },
  async getNews(newsId) {
    return (await this.collection.findOne({ _id: newsId })) || {};
  },
  async getAllUsers() {
    return await this.users.find({}).toArray();
  },
  async removeUser(userId) {
    await this.users.deleteOne({ _id: userId });
  },

  async setUserState(userId, state, stateData) {
    await this.users.updateOne({ _id: userId }, { $set: { state, stateData } });
  },

  async setUserNewsCategories({ userId, news, categories }) {
    const user = await this.users.findOne({ _id: userId });
    const userNews = user.news.find((x) => x.link === news);
    if (!userNews) {
      return;
    }
    userNews.categories = categories;
    await this.users.updateOne({ _id: userId }, { $set: { news: user.news } });
    return userNews.categories;
  },

  async addUserNewsCategory({ userId, news, category }) {
    const user = await this.users.findOne({ _id: userId });
    const userNews = user.news.find((x) => x.link === news);
    if (!userNews) {
      return;
    }

    if (userNews.categories.includes(category)) {
      return;
    }

    userNews.categories.push(category);
    await this.users.updateOne({ _id: userId }, { $set: { news: user.news } });
    return userNews.categories;
  },

  async removeUserNewsCategory({ userId, news, category }) {
    const user = await this.users.findOne({ _id: userId });
    const userNews = user.news.find((x) => x.link === news);
    if (!userNews) {
      return;
    }
    if (!userNews.categories.includes(category)) {
      return;
    }
    userNews.categories = userNews.categories.filter((x) => x !== category);
    await this.users.updateOne({ _id: userId }, { $set: { news: user.news } });
    return userNews.categories;
  },

  async setEnabledNewsForUser({ enabled, link, userId }) {
    const user = await this.users.findOne({ _id: userId });
    let currentNews = user?.news || [];
    const founded = currentNews.find((x) => x.link === link);
    if ((founded && enabled) || (!founded && !enabled)) {
      return currentNews;
    }
    if (founded && !enabled) {
      currentNews = currentNews.filter((x) => x.link !== link);
    }
    if (!founded && enabled) {
      currentNews.push({
        link,
        categories: [],
      });
    }
    await this.users.updateOne(
      { _id: userId },
      { $set: { news: currentNews } }
    );
    return currentNews;
  },

  async createOrUpdateUser(user) {
    const existingUser = await this.users.findOne({ _id: user.id });
    if (existingUser) {
      return;
    }
    const { id: _id, ...userData } = user;
    await this.users.updateOne(
      { _id },
      { $set: { ...userData } },
      { upsert: true }
    );
  },
  async updateUserPause(userId, isPause) {
    await this.users.updateOne({ _id: userId }, { $set: { isPause } });
  },

  async getAllUsersWithSelectedNews(link) {
    const users = await this.users.find({}).toArray();
    return users.filter((user) => user.news.find((x) => x.link === link));
  },

  async updateLastArticleTime(link, time) {
    await this.collection.updateOne(
      { _id: link },
      {
        $set: {
          ...(await this.collection.findOne({ _id: link })),
          time,
        },
      },
      { upsert: true }
    );
  },
  async updateUserLanguage(userId, language) {
    await this.users.updateOne({ _id: userId }, { $set: { language } });
  },
};

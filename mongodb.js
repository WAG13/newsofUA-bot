import { MongoClient } from "mongodb";

const url = "mongodb+srv://user:123@cluster0.twnzn.mongodb.net/test";
const client = new MongoClient(url);

const dbName = "news";

export const dbApi = {
  async start() {
    this.db = client.db(dbName);
    this.collection = this.db.collection("news");
    this.users = this.db.collection("users");
    await client.connect();
  },

  async addRSS(rss) {
    await this.collection.insertOne({
      _id: rss.link,
      ...rss,
    });
  },

  async getRSSInfo(link) {
    return await this.collection.findOne({ _id: link });
  },
  async getAllRss() {
    return await this.collection.find({}).toArray();
  },

  async getAdminIds() {
    return (await this.users.find({}).toArray())
      .filter((user) => user.isAdmin)
      .map((user) => user._id);
  },

  async removeRSS(rss) {
    await this.collection.deleteOne({
      _id: rss._id,
    });
    //TODO: Delete user's news
  },

  async getUser(userId) {
    return (await this.users.findOne({ _id: userId })) || {};
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
};

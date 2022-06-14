import { createMainMenu } from "./mainMenu.js";
import { createSelectSourceMenu } from "./selectSourceMenu.js";
import { createSelectFilterMenu } from "./selectFilterMenu.js";
import { createFeedbackMenu } from "./feedbackMenu.js";
import { createRssMenu } from "./rssMenu.js";
import { dbApi } from "../mongodb.js";
import { t } from "../language/helper.js";
import { sendSplitMessage } from "./splitMessage.js";

export const replyWithMainMenu = async ({ ctx, isAdmin, isPause }) => {
  const userId = ctx.from.id;

  return ctx.reply(await t("main_menu.text", userId), {
    reply_markup: await createMainMenu({
      isAdmin,
      isPause,
      userId,
    }),
  });
};

const MAX_TOP_CATEGORIES_STATS = 5;
const MAX_TOP_NEWS_STATS = 5;

const replaceChars = (str, chars, replace) => {
  return str
    .split("")
    .map((c) => {
      if (chars.indexOf(c) > -1) {
        return replace;
      }
      return c;
    })
    .join("");
};

export const makeHashtag = (hash) =>
  hash.charAt(0) !== "#"
    ? "#" + replaceChars(replaceChars(hash, " /.-", "_"), ":,()'", "")
    : hash;

export const replyWithSourcesMenu = async ({ ctx, sources, text }) => {
  const userId = ctx.from.id;
  await ctx.reply(text || (await t("sources_menu.text", userId)), {
    reply_markup: await createSelectSourceMenu(sources, userId),
  });
};

export const replyWithFilterMenu = async (ctx, news) => {
  const userId = ctx.from.id;
  await ctx.reply(await t("filter_menu.text", userId), {
    reply_markup: await createSelectFilterMenu(news, userId),
  });
};

export const replyWithAboutBot = async ({ ctx, isAdmin, isPause }) => {
  const userId = ctx.from.id;
  await ctx.reply(await t("about_bot", userId), {
    reply_markup: await createMainMenu({ isAdmin, isPause, userId }),
  });
};

export const replyWithStats = async ({ ctx, isAdmin, isPause }) => {
  const users = await dbApi.getAllUsers();
  const news = await dbApi.getAllRss();
  const userId = ctx.from.id;

  const newsSubscribeCount = new Map();
  users
    .map((x) => x.news)
    .flat()
    .map((x) => x.link)
    .forEach((link) =>
      newsSubscribeCount.set(link, newsSubscribeCount.get(link) + 1 || 1)
    );

  const usersCount = users.length;
  const newsCount = news.length;
  const sortedNewsSubscribe = [...newsSubscribeCount].sort(
    (a, b) => b[1] - a[1]
  );

  const topNews = sortedNewsSubscribe
    .slice(0, MAX_TOP_NEWS_STATS)
    .map((x) => x[0]);

  const topNewsCategories = topNews.map((topArticle) => {
    const articleCategoriesCount = new Map();
    const allCategories = users
      .map((x) => x.news)
      .flat()
      .filter((x) => x.link === topArticle)
      .map((x) => x.categories)
      .flat();

    allCategories.forEach((category) => {
      articleCategoriesCount.set(
        category,
        articleCategoriesCount.get(category) + 1 || 1
      );
    });

    return {
      link: topArticle,
      categories: [...articleCategoriesCount]
        .sort((a, b) => b[1] - a[1])
        .map((x) => x[0]),
    };
  });

  const generateTextCategories = async (categories) => {
    if (categories.length === 0) {
      return await t("stats.no_category", userId);
    }
    return await t("stats.popular_categories", userId, {
      categories: categories
        .slice(0, MAX_TOP_CATEGORIES_STATS)
        .map(makeHashtag)
        .join(" "),
    });
  };

  const getTitle = (link) => news.find((x) => x.link === link)?.title;

  const generateTextTopPortals = async () => {
    const results = await Promise.all(
      topNewsCategories.map(
        async ({ link, categories }, index) =>
          `${index + 1}. <b><a href="${link}">${getTitle(
            link
          )}</a></b> (👥 : <b>${newsSubscribeCount.get(
            link
          )}</b>) \n${await generateTextCategories(categories)}`
      )
    );
    return results.join("\n");
  };

  await ctx.reply(
    await t("stats.text", userId, {
      usersCount,
      newsCount,
      textTopPortals: await generateTextTopPortals(),
    }),
    {
      reply_markup: await createMainMenu({ isAdmin, isPause, userId }),
      parse_mode: "HTML",
    }
  );
};

export const replyWithList = async ({ ctx, isAdmin, isPause }) => {
  const userId = ctx.from.id;
  let text = (await t("subscriptions.your_subs", userId)) + ":";

  const user = await dbApi.getUser(ctx.from.id);
  for (const x of user.news) {
    const newsInfo = await dbApi.getRSSInfo(x.link);
    if (newsInfo) {
      text = text + "\n🔷 " + newsInfo.title + "\n🔸 RSS: " + x.link;

      text =
        x.categories.length === 0
          ? text + "\n"
          : text +
            `\n🔹 ${await t("subscriptions.categories", userId)}: ` +
            x.categories.map(makeHashtag).join(" ") +
            "\n";
    }
  }
  await sendSplitMessage(ctx, text, {
    reply_markup: await createMainMenu({ isAdmin, isPause, userId }),
  });
};

export const replyWithFeedback = async (ctx) => {
  const userId = ctx.from.id;
  await ctx.reply(await t("feedback_menu.text", userId), {
    reply_markup: await createFeedbackMenu({ userId }),
  });
};

export const replyWithAddRss = async (ctx) => {
  const userId = ctx.from.id;
  await ctx.reply(await t("rss_menu.add_rss", userId), {
    reply_markup: await createRssMenu(userId),
  });
};

export const replyWithRemoveRss = async (ctx) => {
  const userId = ctx.from.id;
  await ctx.reply(await t("rss_menu.remove_rss", userId), {
    reply_markup: await createRssMenu(userId),
  });
};

export const replyWithAddAdminRss = async (ctx) => {
  const userId = ctx.from.id;
  await ctx.reply(await t("rss_menu.add_admin_rss", userId), {
    reply_markup: await createRssMenu(userId),
  });
};

export const replyWithRemoveAdminRss = async (ctx) => {
  const userId = ctx.from.id;
  await ctx.reply(await t("rss_menu.remove_admin_rss", userId), {
    reply_markup: await createRssMenu(userId),
  });
};

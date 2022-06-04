import { Bot } from "grammy";
import { dbApi } from "./mongodb.js";
import {
  makeHashtag,
  replyWithAboutBot,
  replyWithAddAdminRss,
  replyWithAddRss,
  replyWithFeedback,
  replyWithFilterMenu,
  replyWithList,
  replyWithMainMenu,
  replyWithRemoveAdminRss,
  replyWithRemoveRss,
  replyWithSourcesMenu,
  replyWithStats,
} from "./telegram/menu.js";
import {
  createSourcesList,
  handleSelectSource,
} from "./telegram/selectSourceMenu.js";

import { STATES } from "./telegram/constants.js";
import {
  handleSelectCategory,
  handleSelectCategorySource,
} from "./telegram/selectCategoryMenu.js";
import { handleFeedback } from "./telegram/feedbackMenu.js";
import {
  handleAddAdminRss,
  handleAddRss,
  handleRemoveAdminRss,
  handleRemoveRss,
} from "./telegram/rssMenu.js";
import { handlePause } from "./telegram/pauseMenu.js";
import {
  handleLanguage,
  replyWithLanguageMenu,
} from "./telegram/languageMenu.js";
import { getPathByTranslation, setMapLanguages, t } from "./language/helper.js";
import { BOT_TOKEN } from "./constants.js";
import { Menu } from "@grammyjs/menu";
import { LANGUAGES } from "./language/constants.js";
import { usersLanguages } from "./index.js";

export const bot = new Bot(BOT_TOKEN);

const HEARS = {
  "main_menu.keyboard_filter_news": async (ctx) => {
    const news = await dbApi.getAllRssWithCategories();
    const { state, news: userNews } = await dbApi.getUser(ctx.from.id);
    if (state !== STATES.MAIN_MENU) {
      return;
    }

    await dbApi.setUserState(ctx.from.id, STATES.SELECT_FILTER);
    const filteredNews = userNews
      .map((x) => news.find((y) => y.link === x.link)?.title)
      .filter(Boolean);
    await replyWithFilterMenu(ctx, filteredNews);
  },
  "main_menu.keyboard_select_source": async (ctx) => {
    const {
      _id: userId,
      news: userNews,
      state,
    } = await dbApi.getUser(ctx.from.id);
    // todo: refactor getting news
    const news = await dbApi.getAllRss();
    if (state !== STATES.MAIN_MENU) {
      return;
    }
    await dbApi.setUserState(ctx.from.id, STATES.SELECT_SOURCE);
    await replyWithSourcesMenu({
      ctx,
      sources: createSourcesList(news, userNews, userId),
    });
  },
  "main_menu.keyboard_language": async (ctx) => {
    const { state } = await dbApi.getUser(ctx.from.id);
    if (state !== STATES.MAIN_MENU) {
      return;
    }
    await dbApi.setUserState(ctx.from.id, STATES.SELECT_LANGUAGE);
    await replyWithLanguageMenu({
      ctx,
    });
  },
  go_back: async (ctx) => {
    const {
      state,
      news: userNews,
      isAdmin,
      isPause,
    } = await dbApi.getUser(ctx.from.id);
    const news = await dbApi.getAllRssWithCategories();
    switch (state) {
      case STATES.SELECT_CATEGORY:
        await dbApi.setUserState(ctx.from.id, STATES.SELECT_FILTER);
        const filteredNews = userNews
          .map((x) => news.find((y) => y.link === x.link)?.title)
          .filter(Boolean);
        await replyWithFilterMenu(ctx, filteredNews);
        break;
      case STATES.SELECT_FILTER:
      case STATES.SELECT_SOURCE:
      case STATES.ADD_FEEDBACK:
      case STATES.SELECT_LANGUAGE:
      default:
        await dbApi.setUserState(ctx.from.id, STATES.MAIN_MENU);
        await replyWithMainMenu({ ctx, isAdmin, isPause });
        break;
    }
  },
  "main_menu.keyboard_feedback": async (ctx) => {
    const { state } = await dbApi.getUser(ctx.from.id);
    if (state !== STATES.MAIN_MENU) {
      return;
    }
    await dbApi.setUserState(ctx.from.id, STATES.ADD_FEEDBACK);
    await replyWithFeedback(ctx);
  },
  "main_menu.keyboard_about_bot": async (ctx) => {
    const { state, isAdmin, isPause } = await dbApi.getUser(ctx.from.id);
    if (state !== STATES.MAIN_MENU) {
      return;
    }
    await replyWithAboutBot({ ctx, isAdmin, isPause });
  },
  "main_menu.keyboard_stats": async (ctx) => {
    const { state, isAdmin, isPause } = await dbApi.getUser(ctx.from.id);
    if (state !== STATES.MAIN_MENU) {
      return;
    }
    await replyWithStats({ ctx, isAdmin, isPause });
  },
  "main_menu.keyboard_list": async (ctx) => {
    const { state, isAdmin, isPause } = await dbApi.getUser(ctx.from.id);
    if (state !== STATES.MAIN_MENU) {
      return;
    }
    await replyWithList({ ctx, isAdmin, isPause });
  },
  "main_menu.keyboard_add_rss": async (ctx) => {
    const { state } = await dbApi.getUser(ctx.from.id);
    if (state !== STATES.MAIN_MENU) {
      return;
    }
    await dbApi.setUserState(ctx.from.id, STATES.ADD_RSS);
    await replyWithAddRss(ctx);
  },
  "main_menu.keyboard_remove_rss": async (ctx) => {
    const { state } = await dbApi.getUser(ctx.from.id);
    if (state !== STATES.MAIN_MENU) {
      return;
    }
    await dbApi.setUserState(ctx.from.id, STATES.REMOVE_RSS);
    await replyWithRemoveRss(ctx);
  },
  "main_menu.keyboard_add_admin_rss": async (ctx) => {
    const userId = ctx.from.id;
    const { state } = await dbApi.getUser(userId);
    if (state !== STATES.MAIN_MENU) {
      return;
    }
    const adminIds = await dbApi.getAdminIds();
    if (!adminIds.includes(userId)) {
      await ctx.reply(await t("rss_menu.no_permission", userId));
      return;
    }

    await dbApi.setUserState(userId, STATES.ADD_ADMIN_RSS);
    await replyWithAddAdminRss(ctx);
  },
  "main_menu.keyboard_remove_admin_rss": async (ctx) => {
    const userId = ctx.from.id;
    const { state } = await dbApi.getUser(userId);
    if (state !== STATES.MAIN_MENU) {
      return;
    }
    const adminIds = await dbApi.getAdminIds();
    if (!adminIds.includes(userId)) {
      await ctx.reply(await t("rss_menu.no_permission", userId));
      return;
    }

    await dbApi.setUserState(userId, STATES.REMOVE_ADMIN_RSS);
    await replyWithRemoveAdminRss(ctx);
  },
};

export const startBot = async () => {
  const menu = new Menu("start");

  LANGUAGES.forEach((language) => {
    menu
      .text(language.name, async (ctx) => {
        const userId = ctx.from.id;
        const user = await dbApi.getUser(userId);
        if (Object.keys(user).length === 0) {
          await dbApi.createOrUpdateUser({
            id: ctx.from.id,
            firstName: ctx.from.first_name,
            news: [],
            isPause: false,
            state: STATES.MAIN_MENU,
            isAdmin: false,
            language: language.code,
          });
        }
        await dbApi.setUserState(userId, STATES.MAIN_MENU);
        await dbApi.updateUserLanguage(ctx.from.id, language.code);
        await setMapLanguages(usersLanguages);
        await replyWithAboutBot({ ctx, isPause: false });
      })
      .row();
  });

  bot.use(menu);

  bot.command("start", async (ctx) => {
    await ctx.reply("Choose language", { reply_markup: menu });
  });

  bot.on("message", async (ctx) => {
    const path = await getPathByTranslation(ctx.message.text, ctx.from.id);
    const hearsFunc = HEARS[path];
    if (hearsFunc) {
      await hearsFunc(ctx);
      return;
    }

    const userId = ctx.from.id;
    const { state, stateData, isAdmin, isPause } = await dbApi.getUser(userId);
    const news = await dbApi.getAllRss();
    if (state === STATES.SELECT_SOURCE) {
      await handleSelectSource(ctx);
      return;
    }
    if (state === STATES.SELECT_FILTER) {
      await handleSelectCategory(ctx, news);
      return;
    }
    if (state === STATES.SELECT_CATEGORY) {
      const currentNews = news.find((x) => x.title === stateData.title);
      await handleSelectCategorySource({
        ctx,
        categories: currentNews.categories,
        news: currentNews,
      });
      return;
    }
    if (state === STATES.ADD_FEEDBACK) {
      await handleFeedback({ ctx, isAdmin, isPause });
      return;
    }

    if (state === STATES.ADD_RSS) {
      await handleAddRss({ ctx, isAdmin, isPause });
      return;
    }

    if (state === STATES.REMOVE_RSS) {
      await handleRemoveRss({ ctx, isAdmin, isPause });
      return;
    }

    if (state === STATES.ADD_ADMIN_RSS) {
      await handleAddAdminRss({ ctx, isAdmin, isPause });
      return;
    }

    if (state === STATES.REMOVE_ADMIN_RSS) {
      await handleRemoveAdminRss({ ctx, isAdmin, isPause });
      return;
    }

    if (state === STATES.MAIN_MENU) {
      await handlePause({ ctx, isAdmin, userId });
      return;
    }

    if (state === STATES.SELECT_LANGUAGE) {
      await handleLanguage({ ctx, isAdmin, isPause });
      return;
    }
  });

  bot.catch((err, ctx) => {
    console.log(err, "CRITICAL SUPER ERROR!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
  });

  bot.start();
};

export const sendArticleMessage = async ({
  userId,
  article,
  site,
  category,
}) => {
  const categoryText =
    category.length === 0 ? `\n\n${category.map(makeHashtag).join(" ")}` : "";

  const sourceText = await t("message.source", userId);
  const message = `${article.text}${categoryText}\n\n<b>${sourceText}: <a href="${article.link}">${site}</a></b>`;

  const options = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: await t("message.details_button_text", userId),
            url: article.link,
          },
        ],
      ],
    },
    parse_mode: "HTML",
  };

  try {
    if (article.image && message.length < 1024) {
      if (article.image.slice(-5) === ".webp")
        article.image = article.image.slice(0, -5);
      await bot.api.sendPhoto(userId, article.image, {
        ...options,
        caption: message,
      });
    } else {
      await bot.api.sendMessage(userId, message, options);
    }
  } catch (e) {
    if (e.error_code === 403) {
      await dbApi.removeUser(userId);
      return;
    }
    if (e.error_code === 400) {
      try {
        await bot.api.sendMessage(userId, message, options);
      } catch (e) {
        console.log("CRITICAL ERROR!", e);
      }
      return;
    }
    console.log("Message not send successfully", e);
  }
};

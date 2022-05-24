import { Bot } from "grammy";
import { dbApi } from "./mongodb.js";
import {
  KEYBOARD_GO_BACK,
  makeHashtag,
  replyWithAboutBot,
  replyWithAddRss,
  replyWithFeedback,
  replyWithFilterMenu,
  replyWithList,
  replyWithMainMenu,
  replyWithRemoveRss,
  replyWithSourcesMenu,
  replyWithStats,
} from "./telegram/menu.js";
import {
  createSourcesList,
  handleSelectSource,
} from "./telegram/selectSourceMenu.js";
import {
  KEYBOARD_ABOUT_BOT,
  KEYBOARD_ADD_RSS,
  KEYBOARD_FEEDBACK,
  KEYBOARD_FILTER_NEWS,
  KEYBOARD_LIST,
  KEYBOARD_REMOVE_RSS,
  KEYBOARD_SELECT_SOURCE,
  KEYBOARD_STATS,
} from "./telegram/mainMenu.js";
import { STATES } from "./telegram/constants.js";
import {
  handleSelectCategory,
  handleSelectCategorySource,
} from "./telegram/selectCategoryMenu.js";
import { handleFeedback } from "./telegram/feedbackMenu.js";
import { handleAddRss, handleRemoveRss } from "./telegram/rssMenu.js";
import { handlePause } from "./telegram/pauseMenu.js";

export const bot = new Bot("5253788580:AAA6apMcb_p6rF1P5l8lXi2tlrz05kTPE5M");

export const startBot = async () => {
  bot.hears(KEYBOARD_FILTER_NEWS, async (ctx) => {
    let news = await dbApi.getAllRss();
    news = news.filter((y) => y.categories.length > 1);
    const { state, news: userNews } = await dbApi.getUser(ctx.from.id);
    if (state !== STATES.MAIN_MENU) {
      return;
    }

    await dbApi.setUserState(ctx.from.id, STATES.SELECT_FILTER);
    const filteredNews = userNews
      .map((x) => news.find((y) => y.link === x.link)?.title)
      .filter(Boolean);
    await replyWithFilterMenu(ctx, filteredNews);
  });

  bot.hears(KEYBOARD_SELECT_SOURCE, async (ctx) => {
    const { news: userNews, state } = await dbApi.getUser(ctx.from.id);
    // todo: refactor getting news
    const news = await dbApi.getAllRss();
    if (state !== STATES.MAIN_MENU) {
      return;
    }
    await dbApi.setUserState(ctx.from.id, STATES.SELECT_SOURCE);
    await replyWithSourcesMenu({
      ctx,
      sources: createSourcesList(news, userNews),
    });
  });

  bot.hears(KEYBOARD_GO_BACK, async (ctx) => {
    const {
      state,
      news: userNews,
      isAdmin,
      isPause,
    } = await dbApi.getUser(ctx.from.id);
    const news = await dbApi.getAllRss();
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
      default:
        await dbApi.setUserState(ctx.from.id, STATES.MAIN_MENU);
        await replyWithMainMenu({ ctx, isAdmin, isPause });
        break;
    }
  });

  bot.hears(KEYBOARD_FEEDBACK, async (ctx) => {
    const { state } = await dbApi.getUser(ctx.from.id);
    if (state !== STATES.MAIN_MENU) {
      return;
    }
    await dbApi.setUserState(ctx.from.id, STATES.ADD_FEEDBACK);
    await replyWithFeedback(ctx);
  });

  bot.hears(KEYBOARD_ABOUT_BOT, async (ctx) => {
    const { state, isAdmin, isPause } = await dbApi.getUser(ctx.from.id);
    if (state !== STATES.MAIN_MENU) {
      return;
    }
    await replyWithAboutBot({ ctx, isAdmin, isPause });
  });

  bot.hears(KEYBOARD_STATS, async (ctx) => {
    const { state, isAdmin, isPause } = await dbApi.getUser(ctx.from.id);
    if (state !== STATES.MAIN_MENU) {
      return;
    }
    await replyWithStats({ ctx, isAdmin, isPause });
  });

  bot.hears(KEYBOARD_LIST, async (ctx) => {
    const { state, isAdmin, isPause } = await dbApi.getUser(ctx.from.id);
    if (state !== STATES.MAIN_MENU) {
      return;
    }
    await replyWithList({ ctx, isAdmin, isPause });
  });

  bot.hears(KEYBOARD_ADD_RSS, async (ctx) => {
    const { state } = await dbApi.getUser(ctx.from.id);
    if (state !== STATES.MAIN_MENU) {
      return;
    }
    const adminIds = await dbApi.getAdminIds();
    if (!adminIds.includes(ctx.from.id)) {
      await ctx.reply(
        '❗️ У вас не вистачає прав. Якщо Ви хочете додати/видалити RSS, то зверніться до адміністраторів (кнопка "Надіслати відгук").'
      );
      return;
    }

    await dbApi.setUserState(ctx.from.id, STATES.ADD_RSS);
    await replyWithAddRss(ctx);
  });

  bot.hears(KEYBOARD_REMOVE_RSS, async (ctx) => {
    const { state } = await dbApi.getUser(ctx.from.id);
    if (state !== STATES.MAIN_MENU) {
      return;
    }
    const adminIds = await dbApi.getAdminIds();
    if (!adminIds.includes(ctx.from.id)) {
      await ctx.reply(
        '❗️ У вас не вистачає прав. Якщо Ви хочете додати/видалити RSS, то зверніться до адміністраторів (кнопка "Надіслати відгук").'
      );
      return;
    }

    await dbApi.setUserState(ctx.from.id, STATES.REMOVE_RSS);
    await replyWithRemoveRss(ctx);
  });

  bot.command("start", async (ctx) => {
    const user = await dbApi.getUser(ctx.from.id);
    if (Object.keys(user).length === 0) {
      await dbApi.createOrUpdateUser({
        id: ctx.from.id,
        firstName: ctx.from.first_name,
        news: [],
        isPause: false,
        state: STATES.MAIN_MENU,
        isAdmin: false,
      });
    }
    await dbApi.setUserState(ctx.from.id, STATES.MAIN_MENU);
    await replyWithAboutBot({ ctx, isPause: false });
  });

  bot.on("message", async (ctx) => {
    const { state, stateData, isAdmin, isPause } = await dbApi.getUser(
      ctx.from.id
    );
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

    if (state === STATES.MAIN_MENU) {
      await handlePause({ ctx, isAdmin });
      return;
    }
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
    category.length === 0
      ? `\n\n${category.map((x) => makeHashtag(x)).join(" ")}`
      : "";

  const message = `${article.text}${categoryText}\n\n<b>Джерело: <a href="${article.link}">${site}</a></b>`;

  const options = {
    reply_markup: {
      inline_keyboard: [[{ text: "Детальніше", url: article.link }]],
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
      await bot.api.sendMessage(userId, message, options);
      return;
    }
    console.log("Message not send successfully", e);
  }
};

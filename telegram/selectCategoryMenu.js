import { dbApi } from "../mongodb.js";
import { KEYBOARD_GO_BACK } from "./menu.js";
import { Keyboard } from "grammy";
import {
  DISABLE_ALL,
  DISABLED_SYMBOL,
  ENABLE_ALL,
  ENABLED_SYMBOL,
  STATES,
} from "./constants.js";

export const parseToggleMessage = (news, text) => {
  if (!text) {
    return null;
  }
  if (!text.startsWith(ENABLED_SYMBOL) && !text.startsWith(DISABLED_SYMBOL)) {
    return null;
  }

  const DASH_LENGTH = 2;
  const sourceText = text
    .slice(
      ENABLED_SYMBOL.length + DASH_LENGTH,
      text.length - DISABLED_SYMBOL.length + 1
    )
    ?.trim();
  const source = news.find((source) => source === sourceText);
  if (text.startsWith(ENABLED_SYMBOL)) {
    return {
      enabled: true,
      source,
    };
  } else if (text.startsWith(DISABLED_SYMBOL)) {
    return {
      enabled: false,
      source,
    };
  }

  return null;
};

export const createCategorySourceMenu = (sources) => {
  const keyboard = new Keyboard();

  const rowCondition = (x) => x % 2 === 1;

  keyboard.text(ENABLE_ALL).text(DISABLE_ALL).row();
  sources.forEach((source, index) => {
    const { name, enabled } = source;
    keyboard.text(`${enabled ? ENABLED_SYMBOL : DISABLED_SYMBOL} - ${name}`);

    if (rowCondition(index)) {
      keyboard.row();
    }
  });

  if (rowCondition(sources.length)) {
    keyboard.row();
  }

  return keyboard.text(KEYBOARD_GO_BACK).row();
};

export const createCategoriesList = (allCategories, userCategories) => {
  return allCategories.map((category) => {
    const isEnabledCategory = userCategories
      .map((x) => x.toLowerCase())
      .includes(category.toLowerCase());
    return {
      name: category,
      enabled: isEnabledCategory,
    };
  });
};

const replyWithCategoryMenu = async ({
  text,
  ctx,
  source,
  allCategories,
  categories,
}) => {
  const sources = createCategoriesList(allCategories, categories);
  return ctx.reply(text || `Виберіть категорії для ${source}`, {
    reply_markup: createCategorySourceMenu(sources),
  });
};

export const handleSelectCategory = async (ctx, allNews) => {
  const text = ctx.message.text;
  const news = allNews.find((item) => item.title === text);
  if (!news) {
    return;
  }

  const userNews = (await dbApi.getUser(ctx.from.id)).news;
  const userCategory = userNews.find(
    (item) => item.link === news.link
  ).categories;

  await dbApi.setUserState(ctx.from.id, STATES.SELECT_CATEGORY, {
    title: news.title,
  });

  await replyWithCategoryMenu({
    ctx,
    source: news.title,
    allCategories: news.categories,
    categories: userCategory,
  });
};

export const handleSelectCategorySource = async ({ ctx, categories, news }) => {
  const text = ctx.message.text;
  if (text === ENABLE_ALL || text === DISABLE_ALL) {
    const textAction =
      text === ENABLE_ALL
        ? "Ви підписалися на всі категорії"
        : "Ви відписалися зі всіх категорій";

    const categories = text === DISABLE_ALL ? [] : news.categories;
    const userCategory = await dbApi.setUserNewsCategories({
      userId: ctx.from.id,
      news: news.link,
      categories,
    });

    await replyWithCategoryMenu({
      text: textAction,
      ctx,
      source: news.title,
      allCategories: news.categories,
      categories: userCategory,
    });
    return;
  }

  const { enabled, source } = parseToggleMessage(categories, text) || {};
  if (!source && enabled === undefined) {
    return;
  }

  let userCategory;
  if (enabled) {
    userCategory = await dbApi.removeUserNewsCategory({
      userId: ctx.from.id,
      news: news.link,
      category: source,
    });
  } else {
    userCategory = await dbApi.addUserNewsCategory({
      userId: ctx.from.id,
      news: news.link,
      category: source,
    });
  }
  if (!userCategory) {
    return;
  }

  const textAction = enabled
    ? `Ви відписались від ${source}`
    : `Ви підписались на ${source}`;

  await replyWithCategoryMenu({
    text: textAction,
    ctx,
    source: news.title,
    allCategories: news.categories,
    categories: userCategory,
  });
};

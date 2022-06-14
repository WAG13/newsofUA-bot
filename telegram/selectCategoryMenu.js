import { dbApi } from "../mongodb.js";
import { Keyboard } from "grammy";
import { DISABLED_SYMBOL, ENABLED_SYMBOL, STATES } from "./constants.js";
import { t } from "../language/helper.js";

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

export const createCategorySourceMenu = async (sources, userId) => {
  const keyboard = new Keyboard();

  keyboard.text(await t("go_back", userId)).row();

  const rowCondition = (x) => x % 2 === 1;

  keyboard
    .text(await t("categories_menu.enable_all", userId))
    .text(await t("categories_menu.disable_all", userId))
    .row();
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

  return keyboard;
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
  const userId = ctx.from.id;
  return ctx.reply(
    text || (await t("categories_menu.text", userId, { source })),
    {
      reply_markup: await createCategorySourceMenu(sources, userId),
    }
  );
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
  const userId = ctx.from.id;

  const enableAll = await t("categories_menu.enable_all", userId);
  const disableAll = await t("categories_menu.disable_all", userId);

  if (text === enableAll || text === disableAll) {
    const textAction =
      text === enableAll
        ? await t("categories_menu.you_subscribe_all", userId)
        : await t("categories_menu.you_unsubscribe_all", userId);

    const categories = text === disableAll ? [] : news.categories;
    const userCategory = await dbApi.setUserNewsCategories({
      userId,
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
      userId,
      news: news.link,
      category: source,
    });
  } else {
    userCategory = await dbApi.addUserNewsCategory({
      userId,
      news: news.link,
      category: source,
    });
  }
  if (!userCategory) {
    return;
  }

  const textAction = enabled
    ? await t("categories_menu.you_unsubscribe", userId, { source })
    : await t("categories_menu.you_subscribe", userId, { source });

  await replyWithCategoryMenu({
    text: textAction,
    ctx,
    source: news.title,
    allCategories: news.categories,
    categories: userCategory,
  });
};

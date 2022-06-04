import { replyWithSourcesMenu } from "./menu.js";
import { dbApi } from "../mongodb.js";
import { DISABLED_SYMBOL, ENABLED_SYMBOL } from "./constants.js";
import { Keyboard } from "grammy";
import { t } from "../language/helper.js";

export const parseToggleMessage = (text, news) => {
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
  const source = news.find((source) => source.title === sourceText).link;
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

export const createSelectSourceMenu = async (sources, userId) => {
  const keyboard = new Keyboard();

  keyboard.text(await t("go_back", userId)).row();

  sources.forEach((source) => {
    const { name, enabled } = source;
    keyboard
      .text(`${enabled ? ENABLED_SYMBOL : DISABLED_SYMBOL} - ${name}`)
      .row();
  });

  return keyboard;
};

export const createSourcesList = (allSources, userSources, userId) => {
  return allSources
    .filter((x) => x.isPrivate === false || x.users.includes(userId))
    .map((source) => {
      const isUserSource = userSources
        .map((x) => x.link)
        .some((userSource) => userSource === source.link);
      return {
        name: source.title,
        link: source.link,
        enabled: isUserSource,
      };
    });
};

export const handleSelectSource = async (ctx) => {
  const text = ctx.message.text;
  const news = await dbApi.getAllRss();
  const { enabled, source } = parseToggleMessage(text, news) || {};
  if (!source && enabled === undefined) {
    return;
  }
  const userId = ctx.from.id;
  const userNews = await dbApi.setEnabledNewsForUser({
    enabled: !enabled,
    link: source,
    userId,
  });

  const newsName = news.find((x) => x.link === source).title;
  const textAction = enabled
    ? await t("sources_menu.you_unsubscribe", userId, { newsName })
    : await t("sources_menu.you_subscribe", userId, { newsName });
  const sources = createSourcesList(news, userNews, userId);
  if (!enabled) {
    await dbApi.setUserNewsCategories({
      userId: ctx.from.id,
      news: source,
      categories: news.find((x) => x.link === source)?.categories,
    });
  }
  await replyWithSourcesMenu({ ctx, sources, text: textAction });
};

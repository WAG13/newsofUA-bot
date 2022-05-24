import { KEYBOARD_GO_BACK, replyWithSourcesMenu } from "./menu.js";
import { dbApi } from "../mongodb.js";
import { DISABLED_SYMBOL, ENABLED_SYMBOL } from "./constants.js";
import { Keyboard } from "grammy";

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

export const createSelectSourceMenu = (sources) => {
  const keyboard = new Keyboard();

  sources.forEach((source) => {
    const { name, enabled } = source;
    keyboard
      .text(`${enabled ? ENABLED_SYMBOL : DISABLED_SYMBOL} - ${name}`)
      .row();
  });

  return keyboard.text(KEYBOARD_GO_BACK).row();
};

export const createSourcesList = (allSources, userSources) => {
  return allSources.map((source) => {
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
  const userNews = await dbApi.setEnabledNewsForUser({
    enabled: !enabled,
    link: source,
    userId: ctx.from.id,
  });

  const newsName = news.find((x) => x.link === source).title;
  const textAction = enabled
    ? `Ви відписались від ${newsName}`
    : `Ви підписались на ${newsName}`;
  const sources = createSourcesList(news, userNews);
  if (!enabled) {
    await dbApi.setUserNewsCategories({
      userId: ctx.from.id,
      news: source,
      categories: news.find((x) => x.link === source)?.categories,
    });
  }
  await replyWithSourcesMenu({ ctx, sources, text: textAction });
};

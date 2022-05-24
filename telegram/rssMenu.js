import { Keyboard } from "grammy";
import { KEYBOARD_GO_BACK, replyWithMainMenu } from "./menu.js";
import { getLastArticles, getRSSInfo } from "../services/rss.js";
import { dbApi } from "../mongodb.js";
import { handleData, startMonitoring } from "../services/utils.js";
import { NEWS_INTERVAL } from "../constants.js";
import { monitorings } from "../index.js";
import { sendArticleMessage } from "../telegram.js";
import { STATES } from "./constants.js";

export const createRssMenu = () => {
  return new Keyboard().text(KEYBOARD_GO_BACK).row();
};

export const handleAddRss = async ({ ctx, isAdmin, isPause }) => {
  const rssLink = ctx.message.text;
  if (!rssLink) {
    await ctx.reply("Не вказано RSS-стрічки");
    return;
  }
  try {
    console.log(rssLink);
    const rssInfo = await getRSSInfo(rssLink);
    try {
      await dbApi.addRSS(rssInfo);
      console.log(`Start monitoring RSS: ${rssInfo.title}`);
      const { clear, link } = await startMonitoring({
        onData: handleData,
        getLastArticles,
        interval: NEWS_INTERVAL,
        link: rssLink,
        news: await dbApi.getAllRss(),
      });
      monitorings.set(link, clear);
      await ctx.reply(`Додано: ${rssInfo?.title}`);
      const lastArticle = (await getLastArticles(rssInfo.link))?.[0];
      await sendArticleMessage({
        userId: ctx.from.id,
        article: lastArticle,
        site: rssInfo?.title,
        category: lastArticle.category,
      });
      await dbApi.setUserState(ctx.from.id, STATES.MAIN_MENU);
      await replyWithMainMenu({ ctx, isAdmin, isPause });
    } catch (e) {
      await ctx.reply("RSS-стрічка уже існує");
    }
  } catch (e) {
    console.log(e);
    await ctx.reply("Не вдалося завантажити RSS-стрічку");
  }
};

export const handleRemoveRss = async ({ ctx, isAdmin, isPause }) => {
  const rssLink = ctx.message.text;
  if (!rssLink) {
    await ctx.reply("Не вказано RSS-стрічки");
    return;
  }

  const rssInfo = await dbApi.getRSSInfo(rssLink);
  if (!rssInfo) {
    await ctx.reply("Не знайдено RSS-стрічки");
    return;
  }

  await dbApi.removeRSS(rssInfo);
  const clearMonitoring = monitorings.get(rssLink);
  clearMonitoring?.();
  monitorings.delete(rssLink);
  await ctx.reply("Стрічку видалено");
  await dbApi.setUserState(ctx.from.id, STATES.MAIN_MENU);
  await replyWithMainMenu({ ctx, isAdmin, isPause });
};

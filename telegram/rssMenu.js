import { Keyboard } from "grammy";
import { replyWithMainMenu } from "./menu.js";
import { getLastArticles, getRSSInfo } from "../services/rss.js";
import { dbApi } from "../mongodb.js";
import { sendArticleMessage } from "../telegram.js";
import { RSS_STATUSES, STATES } from "./constants.js";
import { t } from "../language/helper.js";

export const createRssMenu = async (userId) => {
  return new Keyboard().text(await t("go_back", userId)).row();
};

export const handleAddRss = async ({ ctx, isAdmin, isPause }) => {
  const rssLink = ctx.message.text;
  const userId = ctx.from.id;
  if (!rssLink) {
    await ctx.reply(await t("rss_menu.no_text", userId));
    return;
  }

  try {
    const rssInfo = await getRSSInfo(rssLink);
    const { status } = await dbApi.addRSS({
      rssInfo,
      isPrivate: true,
      users: [userId],
    });
    if (status === RSS_STATUSES.EXIST) {
      await ctx.reply(await t("rss_menu.exist", userId));
      return;
    } else if (status === RSS_STATUSES.INSERTED) {
      await ctx.reply(await t("rss_menu.added", userId));
    } else if (status === RSS_STATUSES.UPDATED) {
      await ctx.reply(await t("rss_menu.added_private", userId));
    }

    await dbApi.setUserState(ctx.from.id, STATES.MAIN_MENU);
    await replyWithMainMenu({ ctx, isAdmin, isPause });
  } catch (e) {
    if (e.message === "timeout") {
      await ctx.reply(await t("rss_menu.failed_timeout", userId));
      return;
    }
    await ctx.reply(await t("rss_menu.failed", userId));
  }
};
export const handleRemoveRss = async ({ ctx, isAdmin, isPause }) => {
  const rssLink = ctx.message.text;
  const userId = ctx.from.id;
  if (!rssLink) {
    await ctx.reply(await t("rss_menu.no_text", userId));
    return;
  }

  const rssInfo = await dbApi.getRSSInfo(rssLink);
  if (!rssInfo) {
    await ctx.reply(await t("rss_menu.not_found", userId));
    return;
  }

  const { status } = await dbApi.removeRSS({ rss: rssInfo, userId });
  if (status === RSS_STATUSES.REMOVED) {
    await ctx.reply(await t("rss_menu.removed", userId));
  } else if (status === RSS_STATUSES.NOT_ALLOWED) {
    await ctx.reply(await t("rss_menu.not_allowed", userId));
  } else if (status === RSS_STATUSES.UPDATED) {
    await ctx.reply(await t("rss_menu.removed_private", userId));
  }
  await dbApi.setUserState(ctx.from.id, STATES.MAIN_MENU);
  await replyWithMainMenu({ ctx, isAdmin, isPause });
};

export const handleAddAdminRss = async ({ ctx, isAdmin, isPause }) => {
  const rssLink = ctx.message.text;
  const userId = ctx.from.id;
  if (!rssLink) {
    await ctx.reply(await t("rss_menu.no_text", userId));
    return;
  }
  try {
    console.log(rssLink);
    const rssInfo = await getRSSInfo(rssLink);

    const { status } = await dbApi.addRSS({
      rssInfo,
      isAdmin,
      isPrivate: false,
    });
    if (status === RSS_STATUSES.EXIST) {
      await ctx.reply(await t("rss_menu.exist", userId));
      return;
    }
    if (status === RSS_STATUSES.UPDATED) {
      await ctx.reply(await t("rss_menu.updated", userId));
      await dbApi.setUserState(ctx.from.id, STATES.MAIN_MENU);
      await replyWithMainMenu({ ctx, isAdmin, isPause });
      return;
    }
    await ctx.reply(
      await t("rss_menu.add_info", userId, { title: rssInfo.title })
    );
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
    console.log(e);
    await ctx.reply(await t("rss_menu.failed", userId));
  }
};

export const handleRemoveAdminRss = async ({ ctx, isAdmin, isPause }) => {
  const rssLink = ctx.message.text;
  const userId = ctx.from.id;
  if (!rssLink) {
    await ctx.reply(await t("rss_menu.no_text", userId));
    return;
  }

  const rssInfo = await dbApi.getRSSInfo(rssLink);
  if (!rssInfo) {
    await ctx.reply(await t("rss_menu.not_found", userId));
    return;
  }

  await dbApi.removeRSS({ rss: rssInfo, isAdmin });
  await ctx.reply(await t("rss_menu.removed", userId));
  await dbApi.setUserState(ctx.from.id, STATES.MAIN_MENU);
  await replyWithMainMenu({ ctx, isAdmin, isPause });
};

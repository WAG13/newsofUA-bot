import { Keyboard } from "grammy";
import { bot } from "../telegram.js";
import { dbApi } from "../mongodb.js";
import { replyWithMainMenu } from "./menu.js";
import { STATES } from "./constants.js";
import { t } from "../language/helper.js";

export const createFeedbackMenu = async ({ userId }) => {
  return new Keyboard().text(await t("go_back", userId)).row();
};

export const handleFeedback = async ({ ctx, isAdmin, isPause }) => {
  const feedback = ctx.message.text;
  const userId = ctx.from.id;
  if (!feedback) {
    return ctx.reply(await t("feedback_menu.bad_feedback", userId));
  }
  const username = `@${ctx.from.username}` || ctx.from.first_name;

  const adminIds = await dbApi.getAdminIds();
  for (const creatorId of adminIds) {
    await bot.api.sendMessage(
      creatorId,
      await t("feedback_menu.feedback_from", creatorId, { username, feedback })
    );
  }

  await ctx.reply(await t("feedback_menu.feedback_sent", userId));
  await dbApi.setUserState(ctx.from.id, STATES.MAIN_MENU);
  await replyWithMainMenu({ ctx, isAdmin, isPause });
};

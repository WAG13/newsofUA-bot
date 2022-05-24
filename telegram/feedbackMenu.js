import { Keyboard } from "grammy";
import { bot } from "../telegram.js";
import { dbApi } from "../mongodb.js";
import { KEYBOARD_GO_BACK, replyWithMainMenu } from "./menu.js";
import { STATES } from "./constants.js";

export const createFeedbackMenu = () => {
  return new Keyboard().text(KEYBOARD_GO_BACK).row();
};

export const handleFeedback = async ({ ctx, isAdmin, isPause }) => {
  const feedback = ctx.message.text;
  if (!feedback) {
    return ctx.reply(
      "Недопустимий формат фідбеку. Будь ласка, введіть текстове повідомлення."
    );
  }
  const username = `@${ctx.from.username}` || ctx.from.first_name;

  const adminIds = await dbApi.getAdminIds();
  for (const creatorId of adminIds) {
    await bot.api.sendMessage(
      creatorId,
      `Повідомлення від ${username}: ${feedback}`
    );
  }

  await ctx.reply("Ваше повідомлення надіслано");
  await dbApi.setUserState(ctx.from.id, STATES.MAIN_MENU);
  await replyWithMainMenu({ ctx, isAdmin, isPause });
};

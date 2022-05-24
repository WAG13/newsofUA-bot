import { replyWithMainMenu } from "./menu.js";
import { dbApi } from "../mongodb.js";
import { KEYBOARD_PAUSE, KEYBOARD_RESUME } from "./mainMenu.js";

export const handlePause = async ({ ctx, isAdmin }) => {
  const text = ctx.message.text;

  let isPause = false;
  if (text === KEYBOARD_PAUSE) {
    isPause = true;
  } else if (text === KEYBOARD_RESUME) {
    isPause = false;
  }
  const replyText = isPause
    ? "Надсилання новин призупинено"
    : "Надсилання новин відновлено";

  await ctx.reply(replyText);
  await dbApi.updateUserPause(ctx.from.id, isPause);
  await replyWithMainMenu({ ctx, isAdmin, isPause });
};

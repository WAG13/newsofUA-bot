import { replyWithMainMenu } from "./menu.js";
import { dbApi } from "../mongodb.js";
import { t } from "../language/helper.js";

export const handlePause = async ({ ctx, isAdmin, userId }) => {
  const text = ctx.message.text;

  let isPause = false;
  if (text === (await t("main_menu.keyboard_pause", userId))) {
    isPause = true;
  } else if (text === (await t("main_menu.keyboard_resume", userId))) {
    isPause = false;
  } else {
    return;
  }

  const replyText = isPause
    ? await t("pause_menu.resumed", userId)
    : await t("pause_menu.stopped", userId);

  await ctx.reply(replyText);
  await dbApi.updateUserPause(ctx.from.id, isPause);
  await replyWithMainMenu({ ctx, isAdmin, isPause });
};

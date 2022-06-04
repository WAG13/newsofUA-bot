import { Keyboard } from "grammy";
import { dbApi } from "../mongodb.js";
import { setMapLanguages, t } from "../language/helper.js";
import { usersLanguages } from "../index.js";
import { LANGUAGES } from "../language/constants.js";

export const handleLanguage = async ({ ctx }) => {
  const language = ctx.message.text;
  const languageToSet = LANGUAGES.find(({ name }) => name === language);
  const userId = ctx.from.id;
  if (!languageToSet) {
    await ctx.reply(await t("language_menu.not_found", userId));
    return;
  }

  await dbApi.updateUserLanguage(ctx.from.id, languageToSet.code);
  await setMapLanguages(usersLanguages);
  await ctx.reply(
    await t("language_menu.selected_language", userId, {
      language: languageToSet.name,
    })
  );
  await replyWithLanguageMenu({ ctx });
};

export const createLanguageMenu = async (languages, userId) => {
  const keyboard = new Keyboard();

  keyboard.text(await t("go_back", userId)).row();

  languages.forEach((language) => {
    keyboard.text(language.name);
  });

  return keyboard;
};

export const replyWithLanguageMenu = async ({ ctx }) => {
  const userId = ctx.from.id;
  await ctx.reply(await t("language_menu.text", userId), {
    reply_markup: await createLanguageMenu(LANGUAGES, userId),
  });
};

import { Keyboard } from "grammy";
import { t } from "../language/helper.js";

export const createSelectFilterMenu = async (titles, userId) => {
  const keyboard = new Keyboard();

  keyboard.text(await t("go_back", userId)).row();
  titles.forEach((title) => {
    keyboard.text(title).row();
  });

  return keyboard;
};

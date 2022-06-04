import { Keyboard } from "grammy";
import { t } from "../language/helper.js";

export const createMainMenu = async ({ isAdmin, isPause, userId }) => {
  const keyboard = new Keyboard()
    .text(await t("main_menu.keyboard_select_source", userId))
    .row();
  keyboard.text(await t("main_menu.keyboard_filter_news", userId)).row();

  if (isPause) {
    keyboard.text(await t("main_menu.keyboard_resume", userId)).row();
  } else {
    keyboard.text(await t("main_menu.keyboard_pause", userId)).row();
  }

  keyboard
    .text(await t("main_menu.keyboard_add_rss", userId))
    .text(await t("main_menu.keyboard_remove_rss", userId))
    .row();

  if (isAdmin) {
    keyboard
      .text(await t("main_menu.keyboard_add_admin_rss", userId))
      .text(await t("main_menu.keyboard_remove_admin_rss", userId))
      .row();
  }

  keyboard
    .text(await t("main_menu.keyboard_list", userId))
    .text(await t("main_menu.keyboard_stats", userId))
    .row();
  keyboard.text(await t("main_menu.keyboard_language", userId)).row();
  keyboard
    .text(await t("main_menu.keyboard_about_bot", userId))
    .text(await t("main_menu.keyboard_feedback", userId))
    .row();

  return keyboard;
};

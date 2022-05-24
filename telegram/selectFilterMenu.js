import { Keyboard } from "grammy";
import { KEYBOARD_GO_BACK } from "./menu.js";

export const createSelectFilterMenu = (titles) => {
  const keyboard = new Keyboard();

  titles.forEach((title) => {
    keyboard.text(title).row();
  });

  return keyboard.text(KEYBOARD_GO_BACK).row();
};

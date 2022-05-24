import { Keyboard } from "grammy";
export const KEYBOARD_SELECT_SOURCE = "🌐 Обрати джерела";
export const KEYBOARD_FILTER_NEWS = "📰 Відфільтрувати новини";
export const KEYBOARD_PAUSE = "⏸ Призупинити розсилку";
export const KEYBOARD_RESUME = "▶️ Відновити розсилку";
export const KEYBOARD_ADD_RSS = "➕ Додати RSS";
export const KEYBOARD_REMOVE_RSS = "➖ Видалити RSS";
export const KEYBOARD_ABOUT_BOT = "🤖 Про бота";
export const KEYBOARD_FEEDBACK = "💬 Відправити відгук";
export const KEYBOARD_STATS = "📊 Статистика";
export const KEYBOARD_LIST = "🗄 Мої підписки";

export const createMainMenu = ({ isAdmin, isPause }) => {
  const keyboard = new Keyboard()
    .text(KEYBOARD_SELECT_SOURCE)
    .row()
    .text(KEYBOARD_FILTER_NEWS)
    .row();

  if (isPause) {
    keyboard.text(KEYBOARD_RESUME).row();
  } else {
    keyboard.text(KEYBOARD_PAUSE).row();
  }

  if (isAdmin) {
    keyboard.text(KEYBOARD_ADD_RSS).text(KEYBOARD_REMOVE_RSS).row();
  }

  keyboard.text(KEYBOARD_LIST).text(KEYBOARD_STATS).row();
  keyboard.text(KEYBOARD_ABOUT_BOT).text(KEYBOARD_FEEDBACK).row();

  return keyboard;
};

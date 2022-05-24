import { createMainMenu } from "./mainMenu.js";
import { createSelectSourceMenu } from "./selectSourceMenu.js";
import { createSelectFilterMenu } from "./selectFilterMenu.js";
import { createFeedbackMenu } from "./feedbackMenu.js";
import { createRssMenu } from "./rssMenu.js";
import { dbApi } from "../mongodb.js";

export const KEYBOARD_GO_BACK = "🔙 Назад";

export const replyWithMainMenu = async ({ ctx, isAdmin, isPause }) => {
  return ctx.reply("Головне меню", {
    reply_markup: createMainMenu({ isAdmin, isPause }),
  });
};

export const makeHashtag = (hash) =>
  hash.charAt(0) !== "#"
    ? "#" +
      hash
        .split(" ")
        .join("_")
        .split("/")
        .join("_")
        .split(".")
        .join("_")
        .split("-")
        .join("_")
    : hash;

export const replyWithSourcesMenu = async ({
  ctx,
  sources,
  text = "Оберіть інформаційні портали за якими бажаєте слідкувати\n" +
    "\n" +
    "Умовні позначення:\n" +
    "✅ - Ви уже підписані на дане джерело\n" +
    "❌ - Ви ще не слідкуєта за даним джерелом",
}) => {
  await ctx.reply(text, {
    reply_markup: createSelectSourceMenu(sources),
  });
};

export const replyWithFilterMenu = async (ctx, news) => {
  await ctx.reply("Оберіть джерело до якого застосовується фільтр", {
    reply_markup: createSelectFilterMenu(news),
  });
};

export const replyWithAboutBot = async ({ ctx, isAdmin, isPause }) => {
  await ctx.reply(
    "🔹Telegram-бот @newsofUA_bot призначений для агрегування новин із провідних інформаційних порталів. \n" +
      "\n" +
      "🔹Користувачу доступні функції вибору джерел інформації та їх фільтрації за категоріями.\n" +
      "\n" +
      "🔹Окрім того, користувач має змогу тимчасово призупинити або відновити розсилку новин.",
    {
      reply_markup: createMainMenu({ isAdmin, isPause }),
    }
  );
};

export const replyWithStats = async ({ ctx, isAdmin, isPause }) => {
  await ctx.reply("🛠 Скоро додам статистику по найпопулярнішим порталам.", {
    reply_markup: createMainMenu({ isAdmin, isPause }),
  });
};

export const replyWithList = async ({ ctx, isAdmin, isPause }) => {
  let text = "Ваші підписки:";

  const user = await dbApi.getUser(ctx.from.id);
  for (const x of user.news) {
    const newsInfo = await dbApi.getRSSInfo(x.link);
    if (newsInfo) {
      text = text + "\n🔷 " + newsInfo.title + "\n🔸 RSS: " + x.link;

      text =
        x.categories.length === 0
          ? text + "\n"
          : text +
            "\n🔹 Категорії: " +
            x.categories.map((el) => makeHashtag(el)).join(" ") +
            "\n";
    }
  }
  await ctx.reply(text, {
    reply_markup: createMainMenu({ isAdmin, isPause }),
  });
};

export const replyWithFeedback = async (ctx) => {
  await ctx.reply("Напишіть свій фідбек розробнику", {
    reply_markup: createFeedbackMenu(),
  });
};

export const replyWithAddRss = async (ctx) => {
  await ctx.reply("Напишіть rss посилання яке необхідно добавити", {
    reply_markup: createRssMenu(),
  });
};

export const replyWithRemoveRss = async (ctx) => {
  await ctx.reply("Напишіть rss посилання яке необхідно видалити", {
    reply_markup: createRssMenu(),
  });
};

export default {
  main_menu: {
    text: "Головне Меню",
    keyboard_select_source: "🌐 Обрати джерела",
    keyboard_filter_news: "📰 Відфільтрувати новини",
    keyboard_pause: "⏸ Призупинити розсилку",
    keyboard_resume: "▶️ Відновити розсилку",
    keyboard_add_rss: "➕ Додати RSS",
    keyboard_remove_rss: "➖ Видалити RSS",
    keyboard_add_admin_rss: "➕ Додати RSS (admin)",
    keyboard_remove_admin_rss: "➖ Видалити RSS (admin)",
    keyboard_about_bot: "🤖 Про бота",
    keyboard_feedback: "💬 Відправити відгук",
    keyboard_stats: "📊 Статистика",
    keyboard_list: "🗄 Мої підписки",
    keyboard_language: "🗣🇺🇦 Обрати мову",
  },
  categories_menu: {
    text: ({ source }) => `Виберіть категорії для ${source}`,
    enable_all: "Підписатися на всі категорії",
    disable_all: "Відписатися від усіх категорій",
    you_subscribe_all: "Ви підписалися на всі категорії",
    you_unsubscribe_all: "Ви відписалися зі всіх категорій",
    you_subscribe: ({ source }) => `Ви підписались на ${source}`,
    you_unsubscribe: ({ source }) => `Ви відписались від ${source}`,
  },
  sources_menu: {
    text:
      "Оберіть інформаційні портали за якими бажаєте слідкувати\n" +
      "\n" +
      "Умовні позначення:\n" +
      "✅ - Ви уже підписані на дане джерело\n" +
      "❌ - Ви ще не слідкуєта за даним джерелом",
    you_subscribe: ({ newsName }) => `Ви підписались на ${newsName}`,
    you_unsubscribe: ({ newsName }) => `Ви відписались від ${newsName}`,
  },
  filter_menu: {
    text: "Оберіть джерело до якого застосовується фільтр",
  },
  feedback_menu: {
    text: "Напишіть свій фідбек розробнику",
    bad_feedback:
      "Недопустимий формат фідбеку. Будь ласка, введіть текстове повідомлення.",
    feedback_from: ({ username, feedback }) =>
      `Повідомлення від ${username}: ${feedback}`,
    feedback_sent: "Ваше повідомлення надіслано",
  },
  pause_menu: {
    resumed: "Надсилання новин відновлено",
    stopped: "Надсилання новин призупинено",
  },
  rss_menu: {
    add_rss: "Напишіть rss посилання яке необхідно добавити",
    remove_rss: "Напишіть rss посилання яке необхідно видалити",
    add_admin_rss: "Напишіть rss посилання яке необхідно добавити",
    remove_admin_rss: "Напишіть rss посилання яке необхідно видалити",
    no_text: "Не вказано RSS-стрічки",
    not_found: "Не знайдено RSS-стрічки",
    exist: "RSS-стрічка уже існує",
    added: "RSS-стрічка додана",
    removed: "Стрічку видалено",
    removed_private: "Стрічку видалено (приватна)",
    not_allowed: "Не можна видалити стрічку, що не ваша",
    added_private: "Стрічка додана (приватна)",
    failed: "Не вдалося завантажити RSS-стрічку",
    updated: "RSS-стрічка оновлена і тепер вона доступна для всіх",
    add_info: ({ title }) => `Додано: ${title}`,
    no_permission:
      '❗️ У вас не вистачає прав. Якщо Ви хочете додати/видалити RSS, то зверніться до адміністраторів (кнопка "Надіслати відгук").',
  },
  language_menu: {
    text: "Виберіть мову",
    not_found: "Не знайдено мови з таким назвою. Спробуйте знову.",
    selected_language: ({ language }) => `Вибрано мову: ${language}`,
  },
  go_back: "🔙 Назад",
  about_bot:
    "🔹Telegram-бот @newsofUA_bot призначений для агрегування новин із провідних інформаційних порталів. \n\n" +
    "🔹Користувачу доступні функції вибору джерел інформації та їх фільтрації за категоріями.\n\n" +
    "🔹Окрім того, користувач має змогу тимчасово призупинити або відновити розсилку новин.",
  stats: {
    text: ({
      usersCount,
      newsCount,
      textTopPortals,
    }) => `Кількість користувачів: <b>${usersCount}</b>
Кількість інформаційних порталів: <b>${newsCount}</b>\n
<b>Топ-5 порталів</b> за кількістю підпісників:\n ${textTopPortals}`,
    no_category: "Немає категорій\n",
    popular_categories: ({ categories }) =>
      `Напопулярніші категорії: ${categories}\n`,
  },
  subscriptions: {
    your_subs: "Ваші підписки",
    categories: "Категорії",
  },
  message: {
    details_button_text: "Детальніше",
    source: "Джерело",
  },
};

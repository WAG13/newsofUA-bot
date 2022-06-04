export default {
  main_menu: {
    text: "Main Menu",
    keyboard_select_source: "🌐 Select source",
    keyboard_filter_news: "📰 Filter news",
    keyboard_pause: "⏸ Stop news",
    keyboard_resume: "▶️ Resume news",
    keyboard_add_rss: "➕ Add RSS",
    keyboard_remove_rss: "➖ Remove RSS",
    keyboard_add_admin_rss: "➕ Add RSS (admin)",
    keyboard_remove_admin_rss: "➖ Remove RSS (admin)",
    keyboard_about_bot: "🤖 About bot",
    keyboard_feedback: "💬 Send feedback",
    keyboard_stats: "📊 Stats",
    keyboard_list: "🗄 My subscriptions",
    keyboard_language: "🗣🇬🇧 Select language",
  },
  categories_menu: {
    text: ({ source }) => `Select categories for ${source}`,
    enable_all: "Follow to all categories",
    disable_all: "Unfollow from all categories",
    you_subscribe_all: "You follow to all categories",
    you_unsubscribe_all: "You unfollow from all categories",
    you_subscribe: ({ source }) => `You follow for ${source}`,
    you_unsubscribe: ({ source }) => `You unfollow from ${source}`,
  },
  sources_menu: {
    text:
      "Choose information portals for those you want to follow\n" +
      "Symbols:\n" +
      "✅ - You are already subscribed to this source\n" +
      "❌ - You are not following this source yet",
    you_subscribe: ({ newsName }) => `You subscribe to ${newsName}`,
    you_unsubscribe: ({ newsName }) => `You unsubscribe from ${newsName}`,
  },
  filter_menu: {
    text: "Select source to apply filter",
  },
  feedback_menu: {
    text: "Send your feedback to developer",
    bad_feedback:
      "Wrong news source. Please, select correct one and try again.",
    feedback_from: ({ username, feedback }) =>
      `Message from ${username}: ${feedback}`,
    feedback_sent: "Your feedback has been sent.",
  },
  pause_menu: {
    resumed: "Sending news resumed",
    stopped: "Sending news stopped",
  },
  rss_menu: {
    add_rss: "Write rss link where need to add",
    remove_rss: "Write rss link where need to remove",
    add_admin_rss: "Write rss link where need to add",
    remove_admin_rss: "Write rss link where need to remove",
    no_text: "(EN) Не вказано RSS-стрічки",
    not_found: "(EN) Не знайдено RSS-стрічки",
    exist: "(EN) RSS-стрічка уже існує",
    added: "(EN) RSS-стрічка додана",
    removed: "(EN) Стрічку видалено",
    removed_private: "(EN) Стрічку видалено (приватна)",
    not_allowed: "(EN) Не можна видалити стрічку, що не ваша",
    added_private: "(EN) Стрічка додана (приватна)",
    failed: "(EN) Не вдалося завантажити RSS-стрічку",
    updated: "(EN) RSS-стрічка оновлена і тепер вона доступна для всіх",
    add_info: ({ title }) => `Added: ${title}`,
    no_permission:
      '❗️ (EN) У вас не вистачає прав. Якщо Ви хочете додати/видалити RSS, то зверніться до адміністраторів (кнопка "Надіслати відгук").',
  },
  language_menu: {
    text: "Select language",
    not_found: "Language not found",
    selected_language: ({ language }) => `Selected language: ${language}`,
  },
  go_back: "🔙 Back",
  about_bot:
    "🔹 (EN) MAKE ME ENG PLS :)  Telegram bot @newsofUA_bot призначений для агрегування новин із провідних інформаційних порталів. \n\n" +
    "🔹Користувачу доступні функції вибору джерел інформації та їх фільтрації за категоріями.\n\n" +
    "🔹Окрім того, користувач має змогу тимчасово призупинити або відновити розсилку новин.",
  stats: {
    text: ({
      usersCount,
      newsCount,
      textTopPortals,
    }) => `Users count: <b>${usersCount}</b>
Count information portal: <b>${newsCount}</b>\n
<b>Top 5 portal</b> for subs:\n ${textTopPortals}`,
    no_category: "No categories\n",
    popular_categories: ({ categories }) =>
      `Popular categories: ${categories}\n`,
  },
  subscriptions: {
    your_subs: "Your subscriptions",
    categories: "Categories",
  },
  message: {
    details_button_text: "Details",
    source: "Source",
  },
};

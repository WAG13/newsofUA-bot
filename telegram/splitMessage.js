const MAX_LENGTH = 3000;

export const sendSplitMessage = async (ctx, message, params) => {
  if (message.length <= MAX_LENGTH) {
    await ctx.reply(message, params);
    return;
  }

  const splittedMessages = message.split(" ");
  let text = "";
  for (let i = 0; i < splittedMessages.length; i++) {
    if (text.length + splittedMessages[i].length > MAX_LENGTH) {
      await ctx.reply(text, params);
      text = "";
    }

    text += splittedMessages[i] + " ";
  }
};

const { Telegraf, Scenes, session } = require("telegraf");
require("dotenv/config");

const bot = new Telegraf(process.env.BOT_TOKEN);

const botUser = process.env.BOT_USER;
const channelId = process.env.CHANNEL_ID;
const channelUser = process.env.CHANNEL_USER;
const adminUser = process.env.ADMIN_USER;

const tabrikYollashScene = new Scenes.BaseScene("tabrikYollash");
let originalMessage = null; // Store the original message
let pendingMessage = null; // Store the message being composed

tabrikYollashScene.on("text", async (ctx) => {
  const updatedMessage = ctx.message.text;

  if (updatedMessage) {
    pendingMessage = updatedMessage; // Store the message being composed
    ctx.reply(
      "Tabrikingizni imloviy xatolarini tekshirib koʻring:",
      keyboardCheckReject
    );
  } else {
    ctx.reply("Xatolik");
  }
});

tabrikYollashScene.on("photo", async (ctx) => {
  // Handle photo messages here
  const photo = ctx.message.photo[0]; // Assuming you want the first photo in the array
  const fileId = photo.file_id;
  const photoCaption = ctx.message.caption;

  ctx.session.fileId = fileId;
  ctx.session.photo = photo;
  ctx.session.photoCaption = photoCaption;

  console.log(photo, "photo");
  console.log(fileId, "fileId");

  ctx.reply("Tabrikingizni istasangiz tahrirlang.", keyboardCheckReject);
  pendingMessage = null;
  ctx.scene.leave();
});

tabrikYollashScene.on("video", async (ctx) => {
  const video = [ctx.message.video][0];
  const videoId = video.file_id;
  const videoCaption = ctx.message.caption;

  ctx.session.videoId = videoId;
  ctx.session.video = video;
  ctx.session.videoCaption = videoCaption;

  console.log(video, "video");
  console.log(videoId, "videoId");

  ctx.reply("Tabrikingizni istasangiz tahrirlang.", keyboardCheckReject);
  pendingMessage = null;
  ctx.scene.leave();
});

const stage = new Scenes.Stage([tabrikYollashScene]);

bot.use(session());
bot.use(stage.middleware());

const keyboardReject = {
  reply_markup: {
    inline_keyboard: [[{ text: "❌ Bekor qilish", callback_data: "reject" }]],
  },
};

const keyboardrestart = {
  reply_markup: {
    inline_keyboard: [[{ text: "🔄", callback_data: "restartBot" }]],
  },
};

const keyboardCheckReject = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "✅ Tasdiqlash", callback_data: "check" }],
      [{ text: "❌ Bekor qilish", callback_data: "reject" }],
      [{ text: "🔄 Qayta joʻnatish", callback_data: "restarted" }],
    ],
  },
};

const keyboardTabrikYollash = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "📖 Tabrik Yoʻllash", callback_data: "tabrik_yollash" }],
    ],
  },
};

const keyboardTabrikLink = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "📖 Tabrik Yoʻllash", url: `https://t.me/${botUser}` }],
    ],
  },
};

const keyboardMajburiyAzo = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "➕ A'zo bo'lish", url: `https://t.me/${channelUser}` }],
      [{ text: "✅ Tekshirish", callback_data: "checkMajburiy" }],
    ],
  },
};

bot.command("start", async (ctx) => {
  //
  const userId = ctx.message.from.id;
  const member = await ctx.telegram.getChatMember(channelId, userId);

  ctx.session.userId = userId;
  ctx.session.memberId = member;

  if (member.status === "member" || member.status === "administrator") {
    ctx.reply(
      "Assalomu Alaykum, Tabrik Yoʻllash botimizga xush kelibsiz! \nTabrik jo'natish uchun pastdagi tugmani bosing 👇",
      keyboardTabrikYollash
    );
  } else {
    ctx.reply(
      "Assalomu Alaykum, Tabrik Yoʻllash botimizga xush kelibsiz! \nBotdan To'liq foydalanish uchun pastdagi kanalga a'zo bo'ling👇",
      keyboardMajburiyAzo
    );
  }
});

// left_chat_member

bot.on("left_chat_member", (ctx) => {
  const userId = ctx.message.left_chat_member.id;
  const chatId = ctx.message.from.id;
  const firstName = ctx.message.from.first_name;

  console.log("chiqdi" + " " + firstName);

  console.log("chiqdi" + " " + chatId);

  console.log("chiqdi" + " " + userId);

  ctx.sendMessage(chatId, `Goodbye, user with ID ${userId}!`);
});

// left_chat_member

bot.on("left_chat_member", async (ctx) => {
  const member = ctx.message.left_chat_member;

  // Check if the user is a bot
  if (member) {
    const chatId = ctx.chat.id;

    const message = `Bot @${member.username} (${member.id}) has left the group!`;

    // Send a message to the group
    bot.telegram
      .sendMessage(chatId, message)
      .then(() => {
        console.log(`Message sent to group: ${message}`);
      })
      .catch((error) => {
        console.error(`Error sending a message: ${error}`);
      });
  }
});

bot.action("checkMajburiy", async (ctx) => {
  // const channelId = "";
  const userId = ctx.from.id;

  // Kanalda a'zo bo'lishni tekshirish
  const isMember = await ctx.telegram
    .getChatMember(channelId, userId)
    .then((chatMember) => {
      return (
        chatMember.status === "member" ||
        chatMember.status === "administrator" ||
        chatMember.status === "creator"
      );
    })
    .catch((error) => {
      ctx.editMessageText(
        "Xatolik, Iltimos, /start buyrug'ini qayta jo'natib botni yangilang."
        // keyboardMajburiyAzo
      );

      console.log("Kanal a'zolik holatini tekshirishda xato yuz berdi:", error);

      return false;
    });

  if (isMember) {
    ctx.editMessageText(
      "Assalomu alaykum! Tabrik Yoʻllash botimizga xush kelibsiz! \nTabrik jo'natish uchun quyidagi tugmani bosing 👇",
      keyboardTabrikYollash
    );
  } else {
    ctx.answerCbQuery("Botdan to'liq foydalanish uchun kanalga a'zo bo'ling", {
      show_alert: true,
    });
  }
});

// bot.on("left_chat_member", async (ctx) => {
//   const member = ctx.chatMember;

//   if (member.status === "left") {
//     const userId = member.user.id;
//     const username = member.user.username;

//     const message = `Foydalanuvchi @${username} (${userId}) kanaldan chiqib ketgan.`;

//     // Send a message to the user
//     ctx.telegram
//       .sendMessage(userId, message)
//       .then(() => {
//         console.log(`Message sent to user @${username} (${userId}).`);
//       })
//       .catch((error) => {
//         console.error(`Error sending a message: ${error}`);
//       });
//   }
// });

bot.action("tabrik_yollash", (ctx) => {
  originalMessage = ctx.update.callback_query.message; // Store the original message

  // Get the updated tabrik message from the user
  ctx.editMessageText("Tabrik xabaringizni kiriting:", keyboardReject);

  // Save the user's chat ID for later use
  ctx.session.userId = ctx.from.id;
  ctx.session.firstName = ctx.from.first_name;
  console.log(ctx.from);

  // Transition to the tabrikYollashScene
  ctx.scene.enter("tabrikYollash");
});

bot.action("check", (ctx) => {
  if (pendingMessage) {
    try {
      const messageText = `Yangi Tabrik Yuborildi:\n\n "${pendingMessage}"\n\nKanalimiz: @${channelUser}`;

      ctx.telegram.sendMessage(channelId, messageText, keyboardTabrikLink, {
        parse_mode: "HTML",
      });

      ctx.editMessageText(
        `Tabrikingiz @${channelUser} kanaliga muvaffaqiyatli joylandi.`,
        keyboardrestart
      );
    } catch (error) {
      return ctx.editMessageText(`Qayta urinib ko'ring `, keyboardrestart);
    }
  }

  if (ctx.session.fileId) {
    try {
      const fileId = ctx.session.fileId;
      const photo = ctx.session.photo;
      const photoCaption = ctx.session.photoCaption;

      console.log(fileId, "if ichida fileId");
      console.log(photo, "if ichida photo");
      console.log(channelId, "if ichida channelId");

      ctx.telegram.sendPhoto(channelId, fileId, {
        caption: photoCaption + `\n\n\nTabrik Yoʻllash : @${botUser}`,
      });
      ctx.editMessageText(
        `Tabrikingiz @${channelUser} kanaliga muvaffaqiyatli joylandi.`,
        keyboardrestart
      );
    } catch (error) {
      return ctx.editMessageText(`Qayta urinib ko'ring `, keyboardrestart);
    }
  }

  if (ctx.session.videoId) {
    try {
      const videoId = ctx.session.videoId;
      const video = ctx.session.video;
      const videoCaption = ctx.session.videoCaption;

      console.log(videoId, "if ichida videoId");
      console.log(video, "if ichida video");
      console.log(channelId, "if ichida channelId");

      ctx.telegram.sendVideo(channelId, videoId, {
        caption: videoCaption + `\n\n\nTabrik Yoʻllash : @${botUser}`,
      });
      ctx.editMessageText(
        `Tabrikingiz @${channelUser} kanaliga muvaffaqiyatli joylandi.`,
        keyboardrestart
      );
    } catch (error) {
      return ctx.editMessageText(`Qayta urinib ko'ring `, keyboardrestart);
    }
  }
  // else {
  //   console.log(ctx.session.videoId, "elsechada fileId");

  //   return ctx.reply("Xato Yuborilmadi.");
  // }
});

bot.action("restarted", (ctx) => {
  // Leave the current scene (if any)
  ctx.scene.leave();

  // Enter the "tabrikYollash" scene
  ctx.scene.enter("tabrikYollash");

  // Prompt the user to send a new tabrik message
  ctx.editMessageText("Tabrik xabaringizni qayta kiriting:", keyboardReject);
});

bot.action("reject", (ctx) => {
  ctx.editMessageText(
    "Tabrik jo'natish uchun pastdagi tugmani bosing 👇",
    keyboardTabrikYollash
  );
  ctx.scene.leave();
});

bot.action("restartBot", (ctx) => {
  ctx.scene.leave();
  ctx.editMessageText(
    "Assalomu Alaykum, Tabrik Yoʻllash botimizga xush kelibsiz! \nTabrik jo'natish uchun pastdagi tugmani bosing 👇",
    keyboardTabrikYollash
  );
});

bot.command("help", (ctx) => {
  ctx.reply(
    `Ushbu bot yordamida @${channelUser} kanaliga avtomatik o'z tabrigingizni jo'nata olasiz.`
  );
});

bot.command("dev", (ctx) => {
  ctx.reply(`Dasturchi: ${adminUser}`);
});

const warningWords = ["/start", "/help", "/dev"];

bot.on("text", (ctx) => {
  const messageText = ctx.message.text.toLowerCase();
  if (!warningWords.includes(messageText)) {
    ctx.reply(`Uzr, bu buyruqni tushunmayman. Qayta /start buyrug'ini bosing.`);
  }
});

bot.launch();
console.log("Ishladi");

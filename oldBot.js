const { Telegraf, Scenes, session } = require("telegraf");
require("dotenv/config");
const fs = require("fs");

const bot = new Telegraf(process.env.BOT_TOKEN);

const botUser = process.env.BOT_USER;
const channelId = process.env.CHANNEL_ID;
const channelId2 = process.env.CHANNEL_ID2;
const channelUser = process.env.CHANNEL_USER;
const channelUser2 = process.env.CHANNEL_USER2;
const adminUser = process.env.ADMIN_USER;
const adminId = process.env.ADMIN_ID;

const tabrikYollashScene = new Scenes.BaseScene("tabrikYollash");
let originalMessage = null; // Store the original message
let pendingMessage = null; // Store the message being composed

tabrikYollashScene.on("text", async (ctx) => {
  const updatedMessage = ctx.message.text;

  ctx.reply("Sizning Xabaringiz :\n\n" + " " + updatedMessage);

  if (updatedMessage) {
    pendingMessage = updatedMessage; // Store the message being composed
    ctx.reply("Tabrikingizni tasdiqlang:", keyboardCheckReject);
  } else {
    ctx.reply("Xatolik");
  }
});

tabrikYollashScene.on("photo", async (ctx) => {
  // Handle photo messages here
  const photo = ctx.message.photo[0]; // Assuming you want the first photo in the array
  const fileId = photo.file_id;
  const photoCaption = ctx.message.caption || "";

  ctx.session.fileId = fileId;
  ctx.session.photo = photo;
  ctx.session.photoCaption = photoCaption;

  console.log(photo, "photo");
  console.log(fileId, "fileId");

  try {
    await ctx.telegram.sendPhoto(ctx.from.id, fileId, {
      caption: photoCaption,
    });

    ctx.reply("Tabrikingizni tasdiqlang.", keyboardCheckReject);
  } catch (error) {
    console.log("Error sending the photo:", error);
    ctx.reply("Xatolik yuz berdi. Qayta urinib ko'ring.", keyboardCheckReject);
  }

  pendingMessage = null;
  ctx.scene.leave();
});

tabrikYollashScene.on("video", async (ctx) => {
  const video = ctx.message.video;
  const videoId = video.file_id;
  const videoCaption = ctx.message.caption || "";

  ctx.session.videoId = videoId;
  ctx.session.video = video;
  ctx.session.videoCaption = videoCaption;

  console.log(video, "video");
  console.log(videoId, "videoId");

  try {
    await ctx.telegram.sendVideo(ctx.from.id, videoId, {
      caption: videoCaption,
    });

    ctx.reply("Tabrikingizni tasdiqlang.", keyboardCheckReject);
  } catch (error) {
    console.log("Error sending the video:", error);
    ctx.reply("Xatolik yuz berdi. Qayta urinib ko'ring.", keyboardCheckReject);
  }

  pendingMessage = null;
  ctx.scene.leave();
});

// calculate new year
function calculateTimeToNewYear() {
  const currentDate = new Date();
  const newYearDate = new Date(currentDate.getFullYear() + 1, 0, 1);
  const timeDifference = newYearDate - currentDate;

  return {
    newDays: Math.floor(timeDifference / (1000 * 60 * 60 * 24)),
    newHours: Math.floor(
      (timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    ),
    newMinutes: Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60)),
    newSeconds: Math.floor((timeDifference % (1000 * 60)) / 1000),
  };
}

// Hozirgi vaqtni hisoblash uchun funksiya
function getCurrentTime() {
  const currentDate = new Date();

  const options = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };
  const formattedDate = currentDate.toLocaleDateString("en-US", options);

  return {
    currentHours: currentDate.getHours(),
    currentMinutes: currentDate.getMinutes(),
    currentSeconds: currentDate.getSeconds(),
    currentDate: formattedDate,
  };
}

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
      [{ text: "🆕 Yangi yilni hisoblash", callback_data: "calculatenewyear" }],
    ],
  },
};

const keyboardTabrikLink = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "📖 Tabrik Yoʻllash", url: `https://t.me/${botUser}` }],
      [{ text: "🆕 Yangi yilni hisoblash", url: `https://t.me/${botUser}` }],
    ],
  },
};

const keyboardMajburiyAzo = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "➕ A'zo bo'lish", url: `https://t.me/${channelUser2}` }],
      [{ text: "➕ A'zo bo'lish", url: `https://t.me/${channelUser}` }],
      [{ text: "✅ Tekshirish", callback_data: "checkMajburiy" }],
    ],
  },
};

function saveUserIds(userIds) {
  fs.writeFileSync("user_ids.json", JSON.stringify(userIds, null, 2), "utf8");
}

// Function to load user IDs from the JSON file
function loadUserIds() {
  if (fs.existsSync("user_ids.json")) {
    const data = fs.readFileSync("user_ids.json", "utf8");
    return JSON.parse(data);
  }
  return [];
}

async function sendToAllUsers(messageText) {
  const userIDs = loadUserIds();

  for (const userId of userIDs) {
    try {
      // Use copyMessage to send the message to each user
      await bot.telegram.copyMessage(
        userId,
        channelId,
        originalMessage.message_id
      );
    } catch (error) {
      console.log(
        `Xabar foydalanuvchiga yuborilmadi: ${userId}\nXato: ${error}`
      );
    }
  }
}

function isAdminUser(ctx) {
  console.log(ctx.message.from.id);
  return ctx.message.from.id == adminId;
}

bot.command("start", async (ctx) => {
  const userId = ctx.message.from.id;
  const member = await ctx.telegram.getChatMember(channelId, userId);

  // Load existing user IDs
  let userIDs = loadUserIds();

  // Check if the user ID is already saved
  if (!userIDs.includes(userId)) {
    userIDs.push(userId);
    saveUserIds(userIDs); // Save the updated user IDs
  }

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

let updatedMessage = null;
let isAdminInSendMode = false;

bot.command("stat", (ctx) => {
  const userIDs = loadUserIds();

  if (isAdminUser(ctx)) {
    const totalUsers = userIDs.length;

    const message = `Hozirda foydalanuvchilar soni: ${totalUsers}`;
    ctx.reply(message);
  } else {
    ctx.reply("Siz Admin emassiz");
  }
});

bot.command("admin", (ctx) => {
  const userIDs = loadUserIds();

  if (isAdminUser(ctx)) {
    const message = `/stat - Statistika\n\n/send - Foydalanuvchilarga xabar yuborish`;
    ctx.reply(message);
  } else {
    ctx.reply("Siz Admin emassiz");
  }
});

bot.command("send", async (ctx) => {
  if (isAdminUser(ctx)) {
    if (isAdminInSendMode) {
      // If admin is already in "send mode," send the stored message to all users
      if (updatedMessage) {
        sendToAllUsers(updatedMessage);
        ctx.reply(`Xabar barcha foydalanuvchilarga muvaffaqiyatli yuborildi.`);
      } else {
        ctx.reply("Xabar bo'sh");
      }
      // Reset the "send mode" state
      isAdminInSendMode = false;
    } else {
      // If admin is not in "send mode," set the state to "send mode" and ask for the message
      isAdminInSendMode = true;
      ctx.reply("Iltimos, jo'natmoqchi bo'lgan xabaringizni yuboring:");
    }
  } else {
    ctx.reply("Siz Admin emassiz");
  }
});

bot.on("text", async (ctx) => {
  const userIDs = loadUserIds();
  // Check if the admin user is in "send mode"
  if (isAdminInSendMode) {
    // Store the message as updatedMessage
    updatedMessage = ctx.message.text;

    let successCount = 0;
    let failureCount = 0;

    for (const userId of userIDs) {
      try {
        await ctx.telegram.sendMessage(userId, updatedMessage);
        successCount++;
      } catch (error) {
        console.log(
          `Xabar foydalanuvchiga yuborilmadi: ${userId}\nXato: ${error}`
        );
        failureCount++;
      }
    }

    if (successCount > 0) {
      try {
        await ctx.telegram.sendMessage(
          adminId,
          `Xabar barcha foydalanuvchilarga muvaffaqiyatli yuborildi. Yuborilgan: ${successCount}, Xatolik: ${failureCount}`
        );
      } catch (error) {
        console.log(
          `Xabar admin foydalanuvchiga yuborilmadi: ${adminId}\nXato: ${error}`
        );
      }
    }
  } else {
    const messageText = ctx.message.text.toLowerCase();
    if (!warningWords.includes(messageText)) {
      ctx.reply(
        `Uzr, bu buyruqni tushunmayman. Qayta /start buyrug'ini bosing.`
      );
    }
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

  ctx.sendMessage(
    chatId,
    `Ushbu ${firstName} foydalanuvchi guruhni tark etdi !`
  );
});

// left_chat_member

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

bot.action("calculatenewyear", (ctx) => {
  const remainingTime = calculateTimeToNewYear();
  const currentTime = getCurrentTime();
  console.log(currentTime.currentDate);

  const htmlMessage = `<b>🎄 Yangi 2024-yilga \n\n📆 ${remainingTime.newDays} kun\n⏰ ${remainingTime.newHours} soat\n⏱ ${remainingTime.newMinutes} daqiqa\n⏳ ${remainingTime.newSeconds} soniya qoldi!\n\n------------ Hozirgi vaqt ----------\n\n📆 ${currentTime.currentDate}\n⏰ ${currentTime.currentHours}:${currentTime.currentMinutes}:${currentTime.currentSeconds}\n</b>`;

  ctx.replyWithHTML(htmlMessage, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔄 Yangilash", callback_data: "refreshNewData" }],
      ],
    },
  });

  bot.action("refreshNewData", async (ctx) => {
    // Update the message content
    const updatedHtmlMessage = getUpdatedHtmlMessage();

    // Edit the existing message with the updated content
    await ctx.editMessageText(updatedHtmlMessage, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔄 Yangilash", callback_data: "refreshNewData" }],
        ],
      },
    });

    // Send a notification to the user after processing the action
    await ctx.answerCbQuery("Vaqt Yangilandi!");
  });
});

function getUpdatedHtmlMessage() {
  // Calculate the updated countdown values
  const remainingTime = calculateTimeToNewYear();
  const currentTime = getCurrentTime();

  // Create the updated HTML message
  const updatedHtmlMessage = `<b>🎄 Yangi 2024-yilga \n\n📆 ${remainingTime.newDays} kun\n⏰ ${remainingTime.newHours} soat\n⏱ ${remainingTime.newMinutes} daqiqa\n⏳ ${remainingTime.newSeconds} soniya qoldi!\n\n------------ Hozirgi vaqt ----------\n\n📆 ${currentTime.currentDate}\n⏰ ${currentTime.currentHours}:${currentTime.currentMinutes}:${currentTime.currentSeconds}\n</b>`;

  return updatedHtmlMessage;
}

bot.action("check", (ctx) => {
  if (pendingMessage) {
    try {
      const messageText = `${pendingMessage}\n\nKanalimiz: @${channelUser}`;

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
        caption:
          photoCaption == undefined
            ? ""
            : photoCaption + `\n\n\nTabrik Yoʻllash : @${botUser}`,
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
        caption:
          videoCaption == undefined
            ? ""
            : videoCaption + `\n\n\nTabrik Yoʻllash : @${botUser}`,
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

const warningWords = ["/start", "/help", "/dev", "/stat", "/send"];

bot.on("text", (ctx) => {
  const messageText = ctx.message.text.toLowerCase();
  if (!warningWords.includes(messageText)) {
    ctx.reply(`Uzr, bu buyruqni tushunmayman. Qayta /start buyrug'ini bosing.`);
  }
});

bot.launch();
console.log("Ishladi");

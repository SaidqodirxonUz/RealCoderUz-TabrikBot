const { Telegraf, Scenes, session } = require("telegraf");
require("dotenv/config");
const fs = require("fs");
const axios = require("axios");
const { Buffer } = require("buffer");

const bot = new Telegraf(process.env.BOT_TOKEN);

const botUser = process.env.BOT_USER;
const channelId = process.env.CHANNEL_ID;
const channelId2 = process.env.CHANNEL_ID2;
const channelUser = process.env.CHANNEL_USER;
const channelUser2 = process.env.CHANNEL_USER2;
const adminUser = process.env.ADMIN_USER;
const adminId = process.env.ADMIN_ID;
const realcoderAPI = "https://apis.realcoder.uz/api/newyear/";

const tabrikYollashScene = new Scenes.BaseScene("tabrikYollash");
let originalMessage = null; // Store the original message
let pendingMessage = null; // Store the message being composed

tabrikYollashScene.on("text", async (ctx) => {
  const updatedMessage = ctx.message.text;
  console.log(ctx, "ctx");
  console.log(ctx.from, "ctx from");

  let userIds = ctx.from.id;
  let firstName = ctx.from.first_name;

  ctx.session.firstName = firstName;
  ctx.session.userIds = userIds;

  ctx.reply("Sizning Xabaringiz :\n\n" + " " + updatedMessage, {
    parse_mode: "HTML",
  });

  if (updatedMessage) {
    pendingMessage = updatedMessage; // Store the message being composed
    ctx.reply(
      `<b>🚫Tabrikingizda xatolik yoki nomaqbul (18+) soʻzlar ishlatilgan boʻlsa toʻgʻirlab qayta yuboring\n\n⚠️Toʻgʻri deb hisoblasangiz xabaringizni tasdiqlang.</b>
      `,
      { parse_mode: "HTML", ...keyboardCheckReject }
    );
  } else {
    ctx.reply("Botda Xatolik qayta urinib koʻring", keyboardrestart);
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

    ctx.reply("<b>Tabrikingizni tasdiqlang.</b>", {
      parse_mode: "HTML",
      ...keyboardCheckReject,
    });
  } catch (error) {
    // console.log("Error sending the photo:", error);
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

// Create Certificate

const createCertificateScene = new Scenes.BaseScene("createCertificate");

let userText;

createCertificateScene.enter((ctx) => {
  console.log("shu yerda ");
  ctx.reply("Sertifikat tayyorlash uchun text yuboring:", keyboardReject);
});

// Listen for text messages within the scene
createCertificateScene.hears(/.*/, async (ctx) => {
  // Set userText when a text message is received
  userText = ctx.message.text;

  // Ask the user to select a button
  const inlineKeyboard = [
    [{ text: "❌ Bekor qilish", callback_data: "restartBot" }],
  ];
  for (let i = 1; i <= 7; i++) {
    inlineKeyboard.push([createInlineButton(i)]);
  }

  const inlineKeyboardString = JSON.stringify(inlineKeyboard);

  ctx.reply("Bizda 7-xil dizayn mavjud. \n\nRaqamlardan birini tanlang:", {
    reply_markup: {
      inline_keyboard: inlineKeyboard,
    },
  });
});

// Listen for button presses within the scene
createCertificateScene.action(/select_(\d+)/, async (ctx) => {
  const buttonNumber = ctx.match[1];

  console.log(buttonNumber, "ButtonNumber");

  try {
    if (userText) {
      const text = userText;
      const apiUrl = `${realcoderAPI}${buttonNumber}?text=${text}`;
      console.log(apiUrl, "apiUrl");
      const caption = "Sertifikat muvvafaqiyatli yasaldi.";

      await ctx.replyWithPhoto({ url: apiUrl }, { caption });
    }
    console.log(userText, "UserText");
  } catch (error) {
    ctx.reply(`Sertifikat yasalmadi, XATO likni @${adminUser} ga xabar qiling`);
  }

  // Leave the scene after processing the action
  ctx.scene.leave();
});

function createInlineButton(number) {
  return {
    text: number.toString(),
    callback_data: `select_${number}`,
  };
}

// Register the scene with Telegraf

const stage = new Scenes.Stage([tabrikYollashScene, createCertificateScene]);

bot.use(session());
bot.use(stage.middleware());

// keyboards start
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

const keyboardAdminCheckReject = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "✅ Tasdiqlash", callback_data: "approveTabrik" }],
      [{ text: "❌ Bekor qilish", callback_data: "bekoreTabrik" }],
      [{ text: "🔄 Qayta joʻnatish", callback_data: "restarted" }],
    ],
  },
};

const keyboardTabrikYollash = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "📖 Tabrik Yoʻllash", callback_data: "tabrik_yollash" }],
      [{ text: "🆕 Yangi yilni hisoblash", callback_data: "calculatenewyear" }],
      [
        {
          text: "📃 Sertifikat tayyorlash",
          callback_data: "createCertificate",
        },
      ],
    ],
  },
};

const keyboardTabrikLink = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "📖 Tabrik Yoʻllash", url: `https://t.me/${botUser}` }],
      [{ text: "🆕 Yangi yilni hisoblash", url: `https://t.me/${botUser}` }],
      [
        {
          text: "📃 Sertifikat tayyorlash",
          url: `https://t.me/${botUser}`,
        },
      ],
    ],
  },
};

const keyboardAdminLink = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "👨‍💻Adminstrator", url: `https://t.me/${adminUser}` }],
      [
        {
          text: "🎉Tabrik Yoʻllash Kanalimiz ",
          url: `https://t.me/${channelUser}`,
        },
      ],
      [
        {
          text: "📔Blogimiz",
          url: `https://t.me/${channelUser2}`,
        },
      ],
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

//keyboards end

// User ID saved start
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

// User ID saved end

// congrats json file start

const congratsFilePath = "congrats.json";

// Function to save data to JSON file
function saveDataToJSON(data) {
  fs.writeFileSync(congratsFilePath, JSON.stringify(data, null, 2));
}

// Function to load data from JSON file
function loadDataFromJSON() {
  try {
    const data = fs.readFileSync(congratsFilePath);
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

bot.use((ctx, next) => {
  ctx.session.pendingMessage = null;
  return next();
});

function markMessageAsApproved(messageData) {
  const congratsData = loadDataFromJSON();
  const index = congratsData.findIndex(
    (entry) => entry.message === messageData.message
  );

  if (index !== -1) {
    congratsData[index].approved = true;
    saveDataToJSON(congratsData);
  }
}

// congrats JSON file end

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
      ctx.reply(`Xabar foydalanuvchiga yuborilmadi: ${userId}\nXato: ${error}`);
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
      "<b>Assalomu Alaykum, Tabrik Yoʻllash botimizga xush kelibsiz! \nTabrik jo'natish uchun pastdagi tugmani bosing 👇</b>",
      { parse_mode: "HTML", ...keyboardTabrikYollash }
    );
  } else {
    ctx.reply(
      "<b>Assalomu Alaykum, Tabrik Yoʻllash botimizga xush kelibsiz! \nBotdan To'liq foydalanish uchun pastdagi kanalga a'zo bo'ling👇</b>",
      { parse_mode: "HTML", ...keyboardMajburiyAzo }
    );
  }
});

bot.command("dev", (ctx) => {
  ctx.reply(`Dasturchi: ${adminUser}`);
});

bot.command("help", (ctx) => {
  ctx.reply(
    `<b>Ushbu bot yordamida @${channelUser} kanaliga o'z tabrigingizni jo'natishingiz mumkin.</b>`,
    { parse_mode: "HTML", ...keyboardrestart }
  );
});
// Xatolik yuz berdi. Qayta urinib ko'ring.

//

bot.action("createCertificate", (ctx) => {
  // Start the scene when the 'createCertificate' action is triggered
  ctx.scene.enter("createCertificate");
});

//
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
      "<b>Assalomu alaykum! Tabrik Yoʻllash botimizga xush kelibsiz! \nTabrik jo'natish uchun quyidagi tugmani bosing 👇</b>",
      { parse_mode: "HTML", ...keyboardTabrikYollash }
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
  ctx.editMessageText(
    "<b>Tabrik xabaringizni kiriting:\n\n🚫Tabrikingizda imloviy xatolik va nomaqbul (18+) soʻzlar ishlatmang.</b>",
    { parse_mode: "HTML", ...keyboardReject }
  );

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

bot.action("check", async (ctx) => {
  if (pendingMessage) {
    console.log(pendingMessage, "check");
    try {
      if (pendingMessage) {
        console.log(pendingMessage, "check tryda");
        let firstName = ctx.session.firstName;

        let userIds = ctx.session.userIds;

        const messageText = `<a href="tg://user?id=${userIds}">${firstName}</a> dan yangi tabrik\n\n${pendingMessage}\n\nKanalimiz: @${channelUser}`;

        // Send tabrik message to the admin

        await ctx.telegram.sendMessage(adminId, messageText, {
          parse_mode: "HTML",
          ...keyboardAdminCheckReject,
        });

        const congratsData = loadDataFromJSON();
        const messageData = {
          userId: ctx.session.userIds,
          message: messageText,
          approved: false,
        };
        congratsData.push(messageData);
        saveDataToJSON(congratsData);

        // Ask the admin for approval
        ctx.editMessageText(
          `<b>Tabrikingiz Adminstratorga muvaffaqiyatli yuborildi. \nAgar Adminstrator tomonidan tasdiqlansa kanalimizga joylanadi. \nKanalda kuzatishni davom eting.\n Agar joʻnatmoqchi boʻlgan tabrigingiz juda muhim boʻlsa Adminstrator bilan boʻgʻlaning</b>.`,
          { parse_mode: "HTML", ...keyboardAdminLink }
        );
      }
      ctx.scene.leave();
    } catch (error) {
      return ctx.editMessageText(
        `Joʻnatishda xatolik, Qayta urinib ko'ring `,
        keyboardrestart
      );
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

////////

// Action handler for checking and approving messages
bot.action("approveTabrik", async (ctx) => {
  try {
    const congratsData = loadDataFromJSON();
    const index = congratsData.findIndex((entry) => entry.approved === false);

    console.log(index, "index approve");

    if (index !== -1) {
      // Message is not approved yet

      const messageData = congratsData[index];

      // Send approved message to the channel
      await ctx.telegram.sendMessage(channelId, messageData.message, {
        parse_mode: "HTML",
        ...keyboardTabrikLink,
      });

      ctx.telegram.sendMessage(
        messageData.userId,
        `<b>Sizning xabaringiz ma'qullandi va @${channelUser} kanalga yuborildi !</b>`,
        { parse_mode: "HTML", ...keyboardrestart }
      );

      congratsData[index].approved = true;
      saveDataToJSON(congratsData);

      ctx.answerCbQuery("Muvvafaqiyatli yuborildi", {
        show_alert: true,
      });
    }

    // Reset the pending message
    ctx.session.pendingMessage = null;
  } catch (error) {
    ctx.reply("Xatolik yuz berdi. Iltimos, yana bir bor urinib ko'ring.");
  }
});

// bekoreTabrik

bot.action("bekoreTabrik", async (ctx) => {
  try {
    const congratsData = loadDataFromJSON();

    console.log("Bekore Tabrik da ");
    const index = congratsData.findIndex((entry) => entry.approved === false);

    console.log(index, "index");

    if (index !== -1) {
      // Message is not approved yet

      const messageData = congratsData[index];

      // //Send approved message to the channel
      // await ctx.telegram.sendMessage(channelId, messageData.message, {
      //   parse_mode: "HTML",
      //   ...keyboardTabrikLink,
      // });

      console.log(messageData, "message data");

      ctx.telegram.sendMessage(
        messageData.userId,
        `<b>Sizning xabaringiz ma'qullanmadi, Xabaringizni tekshiring nomaqbul (18+) soʻzlar , va imloga eʻtibor bergan holda qayta yuborishingiz mumkin !</b>`,
        { parse_mode: "HTML", ...keyboardrestart }
      );

      congratsData[index].approved = true;
      saveDataToJSON(congratsData);

      ctx.answerCbQuery("Muvvafaqiyatli bekor qilindi", {
        show_alert: true,
      });
    }

    // Reset the pending message
    ctx.session.pendingMessage = null;
  } catch (error) {
    ctx.reply("Xatolik yuz berdi. Iltimos, yana bir bor urinib ko'ring.");
  }
});

///////////
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
    "<b>Tabrik jo'natish uchun pastdagi tugmani bosing 👇</b>",
    { parse_mode: "HTML", ...keyboardTabrikYollash }
  );
  ctx.scene.leave();
});

bot.action("restartBot", (ctx) => {
  ctx.scene.leave();
  ctx.editMessageText(
    "<b>Assalomu Alaykum, Tabrik Yoʻllash botimizga xush kelibsiz! \nTabrik jo'natish uchun pastdagi tugmani bosing 👇</b>",
    { parse_mode: "HTML", ...keyboardTabrikYollash }
  );
});

const warningWords = ["/start", "/help", "/dev", "/stat", "/send", "/admin"];

bot.on("text", (ctx) => {
  const messageText = ctx.message.text.toLowerCase();
  if (!warningWords.includes(messageText)) {
    ctx.reply(`Uzr, bu buyruqni tushunmayman. Qayta /start buyrug'ini bosing.`);
  }
});

bot.launch();
console.log("Ishladi");

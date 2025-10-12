import express from "express";
import axios from "axios";
import fs from "fs";

const app = express();
app.use(express.json());

const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ADMIN_SECRET = process.env.ADMIN_SECRET || "yuj-secret";

// JSONファイルパス
const USERS_FILE = "./users.json";
const BACKUP_DIR = "./backups";

// 初期化
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify({}));
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR);

// Webhook受信
app.post("/webhook", async (req, res) => {
  console.log("Webhook受信:", JSON.stringify(req.body, null, 2));
  res.sendStatus(200);

  try {
    for (const event of req.body.events) {
      if (event.type !== "message" || event.message.type !== "text") continue;

      const userMessage = event.message.text.trim();
      const userId = event.source.userId;
      const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));

// 💎 有料登録用の合言葉をJSONから読み込む
let currentCode = "";
try {
  const data = fs.readFileSync("./current_code.json", "utf-8");
  currentCode = JSON.parse(data).code;
} catch {
  currentCode = null;
}

// 🧘‍♀️ 有料ユーザー登録（合言葉認証）
if (userMessage === currentCode) {
  users[userId] = {
    ...users[userId],
    isPaid: true,
    paidDate: new Date().toISOString(),
    reminderSent: false,
  };

  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

  await reply(event.replyToken, [
    {
      type: "text",
      text:
        "🌸 プレミアム登録ありがとうございます！\nこれから毎日、心を整えるメッセージをお届けします💌",
    },
  ]);
  return;
}


      // 🧘‍♀️ 無料トライアル判定ロジック
      if (!users[userId]) {
        users[userId] = { startDate: new Date().toISOString() };
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
      }

      const startDate = new Date(users[userId].startDate);
      const now = new Date();
      const diffDays = (now - startDate) / (1000 * 60 * 60 * 24);

      const withinTrial = diffDays <= 3;

      if (!withinTrial && !users[userId]?.isPaid) {
        await reply(event.replyToken, [
          {
            type: "text",
            text: `🕊️ 無料トライアル期間が終了しました。\n\nこれまで一緒に心を整えてくれてありがとう🌸\nもしYujとこれからも穏やかな時間を続けたい方は\nプレミアムプランをご検討ください🧘‍♀️\n\n👉 月額500円で「毎日のひとこと」や\n　「おすすめポーズ」をいつでも利用できます。\n\nhttps://note.com/yuj_yoga_ai/n/n3b26135421ef`,
          },
        ]);
        return;
      }

      // 💎 有料期限チェック
      if (users[userId]?.isPaid && users[userId]?.paidDate) {
        const paidDate = new Date(users[userId].paidDate);
        const diffDaysPaid = (now - paidDate) / (1000 * 60 * 60 * 24);

        // 満了リマインダー（25日目に朝だけ送る）
        if (diffDaysPaid > 25 && diffDaysPaid <= 26 && !users[userId].reminderSent) {
          const hour = now.getHours();
          if (hour >= 7 && hour < 10) {
            users[userId].reminderSent = true;
            fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

            await reply(event.replyToken, [
              {
                type: "text",
                text:
                  "💌 プレミアム期間がもうすぐ終了します。\n\n" +
                  "あと5日で心のヨガ時間がいったんお休みになります🕊️\n" +
                  "これからも続けたい方は、noteのページで\n" +
                  "今月の合言葉をチェックしてください🌸\n\n" +
                  "👉 https://note.com/yuj_yoga_ai/n/n3b26135421ef",
              },
            ]);
          }
        }

        // 30日で終了
        if (diffDaysPaid > 30) {
          users[userId].isPaid = false;
          delete users[userId].paidDate;
          fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

          await reply(event.replyToken, [
            {
              type: "text",
              text: `🕊️ プレミアム期間が終了しました。\n\nまたYujと穏やかな時間を過ごしたい方は、\nnoteの会員ページから今月の合言葉をご確認ください💌\n\nhttps://note.com/yuj_yoga_ai/n/n3b26135421ef`,
            },
          ]);
          return;
        }
      }

      // 🔸「ヨガ」または「メニュー」入力でボタン表示
      if (["ヨガ", "メニュー"].includes(userMessage)) {
        await reply(event.replyToken, [
          {
            type: "template",
            altText: "ヨガモードを選んでください",
            template: {
              type: "buttons",
              thumbnailImageUrl:
                "https://cdn.pixabay.com/photo/2017/08/06/06/47/yoga-2587066_1280.jpg",
              title: "🧘‍♀️ Yuj Yoga Menu",
              text: "今日の気分に合わせて選んでね♪",
              actions: [
                { type: "message", label: "🌅 朝ヨガ", text: "朝ヨガ" },
                { type: "message", label: "🌙 夜リラックス", text: "夜リラックス" },
                { type: "message", label: "💪 肩こり改善", text: "肩こり" },
                { type: "message", label: "🧘‍♀️ ストレスケア", text: "ストレス" },
              ],
            },
          },
        ]);
        return;
      }

      // 🎯 今日のひとこと
      if (userMessage === "今日のひとこと") {
        const messages = [
          "🌿 深呼吸して、心をリセットしてみましょう。",
          "🌸 できない日があっても大丈夫。続けることが大切です。",
          "🌞 あなたのペースで進めば、それで十分。",
          "🪷 今日も小さな一歩を大切にしてね。",
          "💫 今のあなたは、もう十分頑張っています。",
        ];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];

        await reply(event.replyToken, [
          { type: "text", text: `今日のひとこと 🌿\n\n${randomMessage}` },
        ]);
        return;
      }

      // 🔹 AI応答（ChatGPT）
      let systemPrompt =
        "あなたは優しいヨガインストラクターです。初心者にもわかりやすく、心が落ち着く言葉で答えてください。";

      if (userMessage.includes("朝")) systemPrompt += " 朝におすすめの軽いストレッチを紹介してください。";
      else if (userMessage.includes("夜")) systemPrompt += " 夜にリラックスできるポーズを提案してください。";
      else if (userMessage.includes("肩")) systemPrompt += " 肩こりに効果的なヨガポーズを教えてください。";
      else if (userMessage.includes("ストレス")) systemPrompt += " ストレスをやわらげる呼吸法やポーズを紹介してください。";
      else systemPrompt += " その内容に合わせた前向きなメッセージを短く伝えてください。";

      if (/疲|だる|眠|しんど|つら|落ち/.test(userMessage))
        systemPrompt += " ユーザーは少し疲れているようです。優しく共感し、励ますように答えてください。";
      else if (/嬉|最高|楽|元気|ワクワク|ハッピー/.test(userMessage))
        systemPrompt += " ユーザーはポジティブな気分です。その気持ちをさらに高める明るいメッセージを添えてください。";
      else if (/不安|こわ|心配|緊張/.test(userMessage))
        systemPrompt += " ユーザーは不安を感じています。安心できるような落ち着いたトーンで返してください。";

      const aiResponse = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      await reply(event.replyToken, [{ type: "text", text: aiResponse.data.choices[0].message.content }]);
    }
  } catch (error) {
    console.error("エラー:", error.response?.data || error.message);
  }
});

// ✅ 共通返信関数
async function reply(replyToken, messages) {
  await axios.post(
    "https://api.line.me/v2/bot/message/reply",
    { replyToken, messages },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
      },
    }
  );
}
// ✅ 月次処理関数（関数名は自由だけど runMonthlyTask がわかりやすい）
async function runMonthlyTask(res) {
  try {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newCode = `YUJ-${y}-${m}-${random}`;

    const backupPath = `${BACKUP_DIR}/users-${new Date().toISOString().split("T")[0]}.json`;
    if (fs.existsSync(USERS_FILE)) fs.copyFileSync(USERS_FILE, backupPath);

    const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
    for (const userId in users) {
      users[userId].isPaid = false;
      delete users[userId].paidDate;
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

    const message = {
      to: "U5983f5cd5605eec930021acd6cdd6f68", // ← あなたのLINEユーザーIDに置き換える
      messages: [
        {
          type: "text",
          text: `🧘‍♀️ 今月のYujプレミアム合言葉：\n\n${newCode}\n\nnoteの有料記事に貼り替えてください🌿`,
        },
      ],
    };

    await axios.post("https://api.line.me/v2/bot/message/push", message, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
      },
    });

    fs.writeFileSync("./current_code.json", JSON.stringify({ code: newCode }));

    res.send(`✅ 合言葉を更新しました：${newCode}`);
  } catch (error) {
    console.error("🚨 LINE APIエラー発生！");

    if (error.response) {
      console.error("📩 ステータス:", error.response.status);
      console.error("📄 データ:", JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error("❌ リクエストは送信されたがレスポンスがありません。");
      console.error(error.request);
    } else {
      console.error("❌ エラー:", error.message);
    }
  }
}



// ✅ 動作確認
app.get("/", (req, res) => {
  res.send("Yuj Bot is running 🧘‍♀️");
});
// ✅ 管理者専用：月次処理エンドポイント
app.get("/monthly-task", async (req, res) => {
  if (req.query.key !== ADMIN_SECRET) {
    return res.status(403).send("Unauthorized");
  }

  await runMonthlyTask(res);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Yuj Bot is running on port ${PORT}`));













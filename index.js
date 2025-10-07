import express from "express";
import axios from "axios";
import cron from "node-cron";

const app = express();
app.use(express.json());

const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN;

// === 通常Webhook処理 === //
app.post("/webhook", async (req, res) => {
  console.log("Webhook受信:", req.body);
  res.sendStatus(200);

  try {
    for (const event of req.body.events) {
      if (event.type === "message" && event.message.type === "text") {
        const userMessage = event.message.text.trim();

        let replyText = "";

        if (/おはよう|はじめ/.test(userMessage)) {
          replyText = "おはようございます☀️ 今日も一緒に5分ヨガしましょう🧘‍♀️\nおすすめは『太陽礼拝』です。\n準備OKですか？";
        } else if (/OK|はい|うん/.test(userMessage)) {
          replyText = "すばらしい👏\n呼吸に集中して、3回ゆっくり深呼吸してみましょう。\n1…2…3…🌿\n終わったら“できた”と送ってくださいね。";
        } else if (/できた|終わった/.test(userMessage)) {
          replyText = "ナイスです✨ 今日も自分を整えましたね。\n小さな積み重ねが、最高のあなたをつくります🌞\n明日もまた一緒に続けましょう！";
        } else if (/疲れ|休み|だるい/.test(userMessage)) {
          replyText = "大丈夫🌿 休むのもヨガの一部です。\n呼吸だけでも整えましょう。吸って、吐いて。\nまたやる気が戻ったら“おはよう”と送ってくださいね☀️";
        } else {
          replyText = `🧘‍♀️「${userMessage}」ですね。\n今日もいい呼吸をしていきましょう🌿`;
        }

        const replyMessage = {
          replyToken: event.replyToken,
          messages: [{ type: "text", text: replyText }],
        };

        await axios.post("https://api.line.me/v2/bot/message/reply", replyMessage, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
          },
        });
      }
    }
  } catch (error) {
    console.error("エラー:", error.response?.data || error.message);
  }
});

// === 自動おはようメッセージ機能 === //
// あなた自身のLINEユーザーIDをここに入れてください（例: "U1234567890abcdef"）
const USER_ID = "U5983f5cd5605eec930021acd6cdd6f68";

const sendMorningMessage = async () => {
  const message = {
    to: USER_ID,
    messages: [
      {
        type: "text",
        text: "🌞おはようございます！今日も1日5分のヨガ習慣を始めましょう🧘‍♀️\nおすすめは『猫のポーズ』です🐱✨",
      },
    ],
  };

  try {
    await axios.post("https://api.line.me/v2/bot/message/push", message, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
      },
    });
    console.log("✅ 朝のメッセージを送信しました");
  } catch (error) {
    console.error("❌ 自動送信エラー:", error.response?.data || error.message);
  }
};

// 毎朝7時に実行（日本時間）
cron.schedule("0 7 * * *", sendMorningMessage, {
  timezone: "Asia/Tokyo",
});

app.get("/", (req, res) => {
  res.send("🌿 Yuj Bot 稼働中（朝ヨガメッセージ対応）");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Yuj Bot is running on port ${PORT}`);
});







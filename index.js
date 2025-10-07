import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
app.use(bodyParser.json());

// 🔑 あなたのLINEチャネルアクセストークンを貼る
const LINE_ACCESS_TOKEN = "mrBfZxH3HmgBHwyJDq/28tFXLj1IXte1HahdtwUltgBJWlkR4zpz2jYMa/MKHTap0PpmT8+9zyWgUgBwa1E74SgZEfXToCSRb6PaxKT4u3mzcp2Ghx9WjcJSv0eEPY5xkuRtBFbt2p0hq2hSPpfvtQdB04t89/1O/w1cDnyilFU=";

// ✅ LINE Webhook受信
app.post("/webhook", async (req, res) => {
  console.log("Webhook受信:", req.body);
  res.sendStatus(200); // LINEにOKを返す

  try {
    for (const event of req.body.events) {
      if (event.type === "message" && event.message.type === "text") {
        const userMessage = event.message.text;

        // 🔹 Yujのブランドトーン（キーワードで返信分岐）
let replyText = "";

const lowerMsg = userMessage.toLowerCase();

if (lowerMsg.includes("こんにちは") || lowerMsg.includes("はじめまして")) {
  replyText = "こんにちは🌿 ヨガアドバイザーのYujです。今日も心と体を整えましょう。";
} else if (lowerMsg.includes("疲れ") || lowerMsg.includes("ストレス")) {
  replyText = "少し深呼吸しましょう。吸って、吐いて。あなたの内側に静けさを感じて🌼";
} else if (lowerMsg.includes("ヨガ") || lowerMsg.includes("ポーズ")) {
  replyText = "ヨガは形よりも呼吸が大切です。どんなポーズをしたいか教えてくれたらアドバイスするね🧘‍♀️";
} else if (lowerMsg.includes("おやすみ") || lower

        // 🔸返信メッセージ
        const replyMessage = {
          replyToken: event.replyToken,
          messages: [
            {
              type: "text",
              text: `🧘‍♀️こんにちは！「${userMessage}」ですね。\n今日もいい呼吸をしていきましょう🌿`,
            },
          ],
        };

        // 🔸LINEのReply APIを呼び出し
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

// ✅ 動作確認用
app.get("/", (req, res) => {
  res.send("Yuj Bot is running 🧘‍♀️");
});

// ✅ ポート設定
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Yuj Bot is running on port ${PORT}`);
});




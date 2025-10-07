import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Webhook受信
app.post("/webhook", async (req, res) => {
  console.log("Webhook受信:", JSON.stringify(req.body, null, 2));
  res.sendStatus(200);

  try {
    for (const event of req.body.events) {
      if (event.type === "message" && event.message.type === "text") {
        const userMessage = event.message.text;

        // 🧘‍♀️ ChatGPTへのリクエスト
        const aiResponse = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "あなたは優しいヨガインストラクターです。初心者にもわかりやすく、心が落ち着く言葉で答えてください。専門用語を使いすぎず、1〜2文で短く答えてください。",
              },
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

        const aiText = aiResponse.data.choices[0].message.content;

        // LINEへ返信
        const replyMessage = {
          replyToken: event.replyToken,
          messages: [
            {
              type: "text",
              text: aiText,
            },
          ],
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

// 動作確認用
app.get("/", (req, res) => {
  res.send("Yuj Bot with AI Yoga Coach is running 🧘‍♀️");
});

// ポート設定
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Yuj Bot with AI Yoga Coach is running on port ${PORT}`);
});







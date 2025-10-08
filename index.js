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

        // 🔹 応答ロジック：ユーザーのメッセージ内容を分類
let systemPrompt = "あなたは優しいヨガインストラクターです。初心者にもわかりやすく、心が落ち着く言葉で答えてください。";

if (userMessage.includes("肩") || userMessage.includes("こり")) {
  systemPrompt += " 肩こりに効果的なヨガポーズを1〜2個、簡潔に提案してください。";
} else if (userMessage.includes("ストレス") || userMessage.includes("リラックス")) {
  systemPrompt += " 呼吸や心を落ち着ける方法を中心にアドバイスしてください。";
} else if (userMessage.includes("朝") || userMessage.includes("モーニング")) {
  systemPrompt += " 朝におすすめの軽いストレッチやポーズを紹介してください。";
} else if (userMessage.includes("夜") || userMessage.includes("眠れない")) {
  systemPrompt += " 夜におすすめのリラックスできるポーズを紹介してください。";
} else if (userMessage.includes("初心者") || userMessage.includes("初めて")) {
  systemPrompt += " 初心者でも無理なくできる内容で、安心感を与える口調にしてください。";
} else {
  systemPrompt += " その質問に合うヨガのアドバイスや前向きなメッセージを簡潔に伝えてください。";
}


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
    if (error.response) {
      console.error("🔴 OpenAIまたはLINE APIエラー:", error.response.status, error.response.data);
    } else {
      console.error("⚠️ 通信エラー:", error.message);
    }

    // 🔸 ユーザーにも簡単なエラーメッセージを返す
    if (req.body.events?.[0]?.replyToken) {
      try {
        await axios.post("https://api.line.me/v2/bot/message/reply", {
          replyToken: req.body.events[0].replyToken,
          messages: [
            { type: "text", text: "🙏 ただいま接続が混み合っています。少し待ってもう一度試してね。" }
          ]
        }, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
          },
        });
      } catch (sendError) {
        console.error("返信時のエラー:", sendError.message);
      }
    }
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








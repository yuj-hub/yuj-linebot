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

        // 🔹 挨拶またはモード選択の案内
        if (userMessage === "ヨガ" || userMessage === "メニュー") {
          const replyMessage = {
            replyToken: event.replyToken,
            messages: [
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
            ],
          };

          await axios.post(
            "https://api.line.me/v2/bot/message/reply",
            replyMessage,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
              },
            }
          );
          return; // ここで終了（AI呼び出しに進まない）
        }

        // 🔹 応答ロジック（AIに渡す前の判定）
        let systemPrompt =
          "あなたは優しいヨガインストラクターです。初心者にもわかりやすく、心が落ち着く言葉で答えてください。";

        if (userMessage.includes("朝")) {
          systemPrompt += " 朝におすすめの軽いストレッチを紹介してください。";
        } else if (userMessage.includes("夜")) {
          systemPrompt += " 夜にリラックスできるポーズを提案してください。";
        } else if (userMessage.includes("肩")) {
          systemPrompt += " 肩こりに効果的なヨガポーズを教えてください。";
        } else if (userMessage.includes("ストレス")) {
          systemPrompt += " ストレスをやわらげる呼吸法やポーズを紹介してください。";
        } else {
          systemPrompt +=
            " その内容に合わせた前向きなメッセージを短く伝えてください。";
        }

        // 🧘‍♀️ ChatGPTへのリクエスト
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

        const aiText = aiResponse.data.choices[0].message.content;

        // 🔹 LINEへ返信
        const replyMessage = {
          replyToken: event.replyToken,
          messages: [{ type: "text", text: aiText }],
        };

        await axios.post(
          "https://api.line.me/v2/bot/message/reply",
          replyMessage,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
            },
          }
        );
      }
    }
  } catch (error) {
    if (error.response) {
      console.error(
        "🔴 OpenAIまたはLINE APIエラー:",
        error.response.status,
        error.response.data
      );
    } else {
      console.error("⚠️ 通信エラー:", error.message);
    }

    // 🔸 ユーザーにも簡単なエラーメッセージを返す
    if (req.body.events?.[0]?.replyToken) {
      try {
        await axios.post(
          "https://api.line.me/v2/bot/message/reply",
          {
            replyToken: req.body.events[0].replyToken,
            messages: [
              {
                type: "text",
                text: "🙏 ただいま接続が混み合っています。少し待ってもう一度試してね。",
              },
            ],
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
            },
          }
        );
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

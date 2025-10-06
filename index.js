import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

app.post("/webhook", async (req, res) => {
  const event = req.body.events?.[0];
  if (!event || event.type !== "message") return res.sendStatus(200);

  const userMessage = event.message.text;
  try {
    const aiResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "あなたは優しいヨガインストラクター『Yuj』です。質問に対してヨガや呼吸法の提案を日本語で短く、前向きに答えてください。",
          },
          { role: "user", content: userMessage },
        ],
      },
      { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
    );

    const reply = aiResponse.data.choices[0].message.content;

    await axios.post(
      "https://api.line.me/v2/bot/message/reply",
      {
        replyToken: event.replyToken,
        messages: [{ type: "text", text: reply }],
      },
      { headers: { Authorization: `Bearer ${process.env.LINE_ACCESS_TOKEN}` } }
    );
  } catch (err) {
    console.error(err);
  }

  res.sendStatus(200);
});

app.listen(3000, () => console.log("✅ Yuj Bot is running on Render"));

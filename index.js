import express from "express";
import axios from "axios";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN;

app.post("/webhook", async (req, res) => {
  console.log("Webhook受信:", JSON.stringify(req.body, null, 2));
  res.sendStatus(200);

  try {
    if (!req.body.events) return;

    for (const event of req.body.events) {
      if (event.type === "message" && event.message.type === "text") {
        const userMessage = event.message.text.trim();

        let replyText = "";

        // 🧘‍♀️ キーワードで反応を変える
        if (userMessage.includes("ストレッチ")) {
          replyText = "今日は肩回りをほぐしましょう！\n深呼吸をしながら、ゆっくり回して🌿";
        } else if (userMessage.includes("瞑想")) {
          replyText = "静かに座って、呼吸に意識を向けてみましょう。\n1分でも効果あります🕯";
        } else if (userMessage.includes("疲れ")) {
          replyText = "おつかれさまです🍵\n5分だけでも足を伸ばしてリラックスしてね。";
        } else if (userMessage.includes("朝") || userMessage.includes("モーニング")) {
          replyText = "おはようございます☀️\n朝ヨガで1日を整えましょう。おすすめは太陽礼拝🌞";
        } else if (userMessage.includes("夜") || userMessage.includes("ナイト")) {
          replyText = "夜はリラックスヨガがおすすめ🌙\n深い呼吸で1日の緊張をほどいてね。";
        } else {
          replyText = `🧘‍♀️「${userMessage}」ですね。\n心と体を整えるお手伝いをします🌿`;
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

app.get("/", (req, res) => {
  res.send("Yuj Bot is running 🧘‍♀️");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Yuj Bot is running on port ${PORT}`);
});






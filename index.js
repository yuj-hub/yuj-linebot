import express from "express";
import axios from "axios";
import fs from "fs"; // ← ここにまとめてOK

const app = express();
app.use(express.json());

const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// JSONファイルパス
const USERS_FILE = "./users.json";
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify({}));

// Webhook受信
app.post("/webhook", async (req, res) => {
  console.log("Webhook受信:", JSON.stringify(req.body, null, 2));
  res.sendStatus(200);

  try {
    for (const event of req.body.events) {
      if (event.type === "message" && event.message.type === "text") {
        const userMessage = event.message.text;
        const userId = event.source.userId;
        const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));

        // 💎 有料登録用の合言葉
        const PAID_CODE = "YUJ500";

        // 🧘‍♀️ 有料ユーザー登録（合言葉認証）
        if (userMessage === PAID_CODE) {
  users[userId] = {
    ...users[userId],
    isPaid: true,
    paidDate: new Date().toISOString(), // ← 登録日を保存
  };

          fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

          const replyMessage = {
            replyToken: event.replyToken,
            messages: [
              {
                type: "text",
                text: "🌸 プレミアム登録ありがとうございます！\nこれから毎日、心を整えるメッセージをお届けします💌",
              },
            ],
          };

          await axios.post("https://api.line.me/v2/bot/message/reply", replyMessage, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
            },
          });
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
          const replyMessage = {
            replyToken: event.replyToken,
            messages: [
              {
                type: "text",
                text: `🕊️ 無料トライアル期間が終了しました。\n\nこれまで一緒に心を整えてくれてありがとう🌸\nもしYujとこれからも穏やかな時間を続けたい方は\nプレミアムプランをご検討ください🧘‍♀️\n\n👉 月額500円で「毎日のひとこと」や\n　「おすすめポーズ」をいつでも利用できます。\n\nhttps://example.com/premium`,
              },
            ],
          };

          await axios.post("https://api.line.me/v2/bot/message/reply", replyMessage, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
            },
          });
          return;
        }
        
// 💎 有料期限チェック
if (users[userId]?.isPaid && users[userId]?.paidDate) {
  const paidDate = new Date(users[userId].paidDate);
  const now = new Date();
  const diffDays = (now - paidDate) / (1000 * 60 * 60 * 24);

  if (diffDays > 30) {
    users[userId].isPaid = false;
    delete users[userId].paidDate; // 古い記録削除
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

    const replyMessage = {
      replyToken: event.replyToken,
      messages: [
        {
          type: "text",
          text: `🕊️ プレミアム期間が終了しました。\n\nまたYujと穏やかな時間を過ごしたい方は、\nnoteの会員ページから今月の合言葉をご確認ください💌\n\nhttps://example.com/premium`,
        },
      ],
    };

    await axios.post("https://api.line.me/v2/bot/message/reply", replyMessage, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
      },
    });

    return;
  }
}

        // 🔸「ヨガ」または「メニュー」入力でボタン表示
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

          await axios.post("https://api.line.me/v2/bot/message/reply", replyMessage, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
            },
          });
          return;
        }

        // 🎯 今日のひとこと 機能
        if (userMessage === "今日のひとこと") {
          const messages = [
            "🌿 深呼吸して、心をリセットしてみましょう。",
            "🌸 できない日があっても大丈夫。続けることが大切です。",
            "🌞 あなたのペースで進めば、それで十分。",
            "🪷 今日も小さな一歩を大切にしてね。",
            "💫 今のあなたは、もう十分頑張っています。",
          ];
          const randomMessage = messages[Math.floor(Math.random() * messages.length)];

          const replyMessage = {
            replyToken: event.replyToken,
            messages: [{ type: "text", text: `今日のひとこと 🌿\n\n${randomMessage}` }],
          };

          await axios.post("https://api.line.me/v2/bot/message/reply", replyMessage, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
            },
          });
          return;
        }

        // 🔹 AI応答（ChatGPT）
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
          systemPrompt += " その内容に合わせた前向きなメッセージを短く伝えてください。";
        }

        if (/疲|だる|眠|しんど|つら|落ち/.test(userMessage)) {
          systemPrompt +=
            " ユーザーは少し疲れているようです。優しく共感し、励ますように答えてください。";
        } else if (/嬉|最高|楽|元気|ワクワク|ハッピー/.test(userMessage)) {
          systemPrompt +=
            " ユーザーはポジティブな気分です。その気持ちをさらに高める明るいメッセージを添えてください。";
        } else if (/不安|こわ|心配|緊張/.test(userMessage)) {
          systemPrompt +=
            " ユーザーは不安を感じています。安心できるような落ち着いたトーンで返してください。";
        }

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

        const replyMessage = {
          replyToken: event.replyToken,
          messages: [{ type: "text", text: aiText }],
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

// ✅ 動作確認用
app.get("/", (req, res) => {
  res.send("Yuj Bot with Emotion-Aware Yoga Coach is running 🧘‍♀️");
});

// ✅ ポート設定
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Yuj Bot is running on port ${PORT}`);
});


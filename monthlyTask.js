// monthlyTask.js
import fs from "fs";
import axios from "axios";

// ✅ LINE Bot 管理者のユーザーID（あなたのLINE IDを入れる）
const ADMIN_USER_ID = "dub-y";

// ✅ LINEトークン（Renderで設定した環境変数と同じ）
const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN;

// ✅ ファイルパス
const USERS_FILE = "./users.json";
const BACKUP_DIR = "./backups";
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR);

// ✅ 今月の新しい合言葉を生成（例：YUJ-2025-10-4F9B）
function generateNewCode() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `YUJ-${y}-${m}-${random}`;
}

// ✅ メイン関数
(async () => {
  const newCode = generateNewCode();

  // 🔹 users.jsonのバックアップを保存
  if (fs.existsSync(USERS_FILE)) {
    const backupPath = `${BACKUP_DIR}/users-${new Date().toISOString().split("T")[0]}.json`;
    fs.copyFileSync(USERS_FILE, backupPath);
    console.log(`✅ Backup saved: ${backupPath}`);
  }

  // 🔹 現在のusers.jsonを読み込み＆リセット
  const users = fs.existsSync(USERS_FILE)
    ? JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"))
    : {};

  for (const userId in users) {
    if (users[userId].isPaid) {
      // プレミアム継続者をリセットせず残す
      users[userId].isPaid = false;
    }
  }

  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

  // 🔹 管理者に新コードを通知
  const message = {
    to: ADMIN_USER_ID,
    messages: [
      {
        type: "text",
        text: `🧘‍♀️ 今月のYujプレミアム合言葉が自動生成されました。\n\n【合言葉】${newCode}\n\nこれをnoteの有料記事に貼ってください🌿\n\n※バックアップも保存済みです。`,
      },
    ],
  };

  await axios.post("https://api.line.me/v2/bot/message/push", message, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
    },
  });

  console.log(`✅ New code generated & sent: ${newCode}`);
})();

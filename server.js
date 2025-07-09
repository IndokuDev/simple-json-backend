const express = require("express");
const fs = require("fs-extra");
const cors = require("cors");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = 3000;
const DATA_FILE = path.join(__dirname, "data.json");

// ========= Middleware =========
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://verdant-duckanoo-401ce5.netlify.app",
  ],
  methods: ["GET", "POST", "DELETE"],
  credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// API Key protection (for REST, not Socket.io)
app.use((req, res, next) => {
  const isStatic = req.path.startsWith("/style.css") || req.path.endsWith(".html");

  if (isStatic) {
    return next(); // jangan cek API key untuk file statis
  }

  const apiKey = req.headers["x-app-key"];
  const allowedKeys = ["rahasia-frontend-123"];

  if (!allowedKeys.includes(apiKey)) {
    // Tampilkan blocked.html dari public folder
    return res.status(403).sendFile(path.join(__dirname, "public", "index.html"));
  }

  next();
});


// ========= Data Init =========
if (!fs.existsSync(DATA_FILE)) {
  fs.writeJsonSync(DATA_FILE, { users: [], chats: [] }, { spaces: 2 });
}

function readData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}
function getAllUsersExcept(uid) {
  const data = readData();
  return data.users
    .filter((u) => u.uid !== uid)
    .map(({ uid, username, photo_profile }) => ({ uid, username, photo_profile }));
}
function findUserByUid(uid) {
  const data = readData();
  const user = data.users.find((u) => u.uid === uid);
  if (!user) return null;
  const { username, photo_profile } = user;
  return { uid, username, photo_profile };
}

// ========= REST API =========
app.get("/api/users", async (req, res) => {
  const data = await fs.readJson(DATA_FILE);
  const users = data.users.map(({ uid, username, photo_profile, created_at }) => ({
    uid, username, photo_profile, created_at
  }));
  res.json(users);
});

app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  const data = await fs.readJson(DATA_FILE);

  if (data.users.find((u) => u.username === username)) {
    return res.status(400).json({ error: "Username already exists" });
  }

  const newUser = {
    uid: uuidv4(),
    username,
    password,
    photo_profile: "",
    created_at: Date.now(),
  };

  data.users.push(newUser);
  await fs.writeJson(DATA_FILE, data, { spaces: 2 });
  res.json({ success: true, uid: newUser.uid });
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const data = await fs.readJson(DATA_FILE);
  const user = data.users.find((u) => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  res.json({ success: true, uid: user.uid });
});

// ========= Socket.io =========
io.on("connection", (socket) => {
  console.log("✅ Client connected:", socket.id);

  socket.on("get_users", (uid) => {
    const users = getAllUsersExcept(uid);
    socket.emit("users", users);
  });

  socket.on("get_current_user", (uid) => {
    const user = findUserByUid(uid);
    socket.emit("current_user", user);
  });

  socket.on("send_message", (chat) => {
    const data = readData();
    const newChat = { ...chat, timestamp: Date.now() };
    data.chats.push(newChat);
    writeData(data);
    io.emit("new_message", newChat);
  });

  socket.on("get_chats", ({ uid, recipient }) => {
    const data = readData();
    const relevant = data.chats.filter(
      (c) =>
        (c.from === uid && c.to === recipient) ||
        (c.from === recipient && c.to === uid)
    );
    socket.emit("chats", relevant);
  });

  socket.on("delete_message", ({ from, timestamp }) => {
    const data = readData();
    const index = data.chats.findIndex(
      (c) => c.from === from && c.timestamp === timestamp
    );
    if (index !== -1) {
      data.chats.splice(index, 1);
      writeData(data);
      io.emit("deleted_message", timestamp);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// ========= Start Server =========
server.listen(PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}`);
});

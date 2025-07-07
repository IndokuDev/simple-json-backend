const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// ✅ Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'https://simple-chat-json-psmwc16se-indokudevs-projects.vercel.app',
    'https://whimsical-kitten-32b639.netlify.app'
  ]
}));
app.use(express.json());

// ✅ Auto init file kalau belum ada
async function ensureDataFile() {
  if (!(await fs.pathExists(DATA_FILE))) {
    await fs.writeJson(DATA_FILE, { users: [], chats: [] }, { spaces: 2 });
  }
}
ensureDataFile();

// ✅ GET semua user (tanpa password)
app.get('/api/users', async (req, res) => {
  const data = await fs.readJson(DATA_FILE);
  const users = data.users.map(u => u.username);
  res.json(users);
});

// ✅ REGISTER
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username & password required' });

  const data = await fs.readJson(DATA_FILE);
  const exists = data.users.find(u => u.username === username);
  if (exists) return res.status(400).json({ error: 'Username already exists' });

  data.users.push({ username, password });
  await fs.writeJson(DATA_FILE, data, { spaces: 2 });
  res.json({ success: true });
});

// ✅ LOGIN
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });

  const data = await fs.readJson(DATA_FILE);
  const user = data.users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  res.json({ success: true });
});

// ✅ SEND CHAT
app.post('/api/chat', async (req, res) => {
  const { from, to, message } = req.body;
  if (!from || !to || !message) return res.status(400).json({ error: 'Missing fields' });

  const data = await fs.readJson(DATA_FILE);
  data.chats.push({ from, to, message, timestamp: Date.now() });
  await fs.writeJson(DATA_FILE, data, { spaces: 2 });

  res.json({ success: true });
});

// ✅ GET semua chat
app.get('/api/chats', async (req, res) => {
  const data = await fs.readJson(DATA_FILE);
  res.json(data.chats || []);
});

// ✅ Optional: Debug - get full data.json
app.get('/api/data', async (req, res) => {
  const data = await fs.readJson(DATA_FILE);
  res.json(data);
});

// ✅ Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

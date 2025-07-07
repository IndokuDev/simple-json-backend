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
    'https://simple-chat-json-psmwc16se-indokudevs-projects.vercel.app',
    'https://whimsical-kitten-32b639.netlify.app',
    'http://127.0.0.1:3000'
  ]
}));
app.use(express.json());

app.get('/api/users', async (req, res) => {
  const data = await fs.readJson(DATA_FILE);
  res.json(data.users.map(u => u.username));
});

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  const data = await fs.readJson(DATA_FILE);
  if (data.users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'Username already exists' });
  }
  data.users.push({ username, password });
  await fs.writeJson(DATA_FILE, data, { spaces: 2 });
  res.json({ success: true });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const data = await fs.readJson(DATA_FILE);
  const user = data.users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ success: true });
});

app.post('/api/chat', async (req, res) => {
  const { from, to, message } = req.body;
  const data = await fs.readJson(DATA_FILE);
  data.chats.push({ from, to, message, timestamp: Date.now() });
  await fs.writeJson(DATA_FILE, data, { spaces: 2 });
  res.json({ success: true });
});
app.get('/api/users', async (req, res) => {
  const data = await fs.readJson(DATA_FILE);
  const users = data.users.map(u => u.username);
  res.json(users);
});
app.get('/api/data', async (req, res) => {
  const data = await fs.readJson(DATA_FILE);
  res.json(data);
});
app.get('/api/chats', async (req, res) => {
  const data = await fs.readJson(DATA_FILE);
  res.json(data.chats);
});
// app.post('/api/register', async (req, res) => {
//   const { username, password } = req.body;
//   const data = await fs.readJson(DATA_FILE);
//   if (data.users.find(u => u.username === username)) {
//     return res.status(400).json({ error: 'Username already exists' });
//   }
//   data.users.push({ username, password });
//   await fs.writeJson(DATA_FILE, data, { spaces: 2 });
//   res.json({ success: true });
// });

// app.post('/api/login', async (req, res) => {
//   const { username, password } = req.body;
//   const data = await fs.readJson(DATA_FILE);
//   const user = data.users.find(u => u.username === username && u.password === password);
//   if (!user) return res.status(401).json({ error: 'Invalid credentials' });
//   res.json({ success: true });
// });

// app.post('/api/chat', async (req, res) => {
//   const { from, to, message } = req.body;
//   const data = await fs.readJson(DATA_FILE);
//   data.chats.push({ from, to, message, timestamp: Date.now() });
//   await fs.writeJson(DATA_FILE, data, { spaces: 2 });
//   res.json({ success: true });
// });

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

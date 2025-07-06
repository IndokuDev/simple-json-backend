const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const cors = require('cors');
const ip = require('ip');
const https = require('https');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// ✅ Sertifikat HTTPS lokal (harus pakai mkcert atau self-signed cert)
const sslOptions = {
  key: fs.readFileSync('./cert-key.pem'),
  cert: fs.readFileSync('./cert.pem')
};

// ✅ Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://192.168.29.117:3000',
    'https://simple-chat-json-otdel5j2y-indokudevs-projects.vercel.app/'
  ]
}));

app.use(express.json());
app.use(express.static('public'));

// ✅ ROUTES
app.get('/api/data', async (req, res) => {
  const data = await fs.readJson(DATA_FILE);
  res.json(data);
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

app.get('/api/chats', async (req, res) => {
  const data = await fs.readJson(DATA_FILE);
  res.json(data.chats);
});

// ✅ Jalankan HTTPS Server
https.createServer(sslOptions, app).listen(PORT, '0.0.0.0', () => {
  console.log(`✅ HTTPS Server running at:`);
  console.log(`👉 https://localhost:${PORT}`);
  console.log(`👉 https://${ip.address()}:${PORT}`);
});

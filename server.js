const express = require('express')
const fs = require('fs-extra')
const cors = require('cors')
const path = require('path')
const { v4: uuidv4 } = require('uuid')

const app = express()
const PORT = 3000
const DATA_FILE = path.join(__dirname, 'data.json')

app.use(cors())
app.use(express.json())

// Ensure data.json exists
if (!fs.existsSync(DATA_FILE)) {
  fs.writeJsonSync(DATA_FILE, { users: [], chats: [] }, { spaces: 2 })
}

// GET all users (without password)
app.get('/api/users', async (req, res) => {
  const data = await fs.readJson(DATA_FILE)
  const users = data.users.map(u => ({
    uid: u.uid,
    username: u.username,
    photo_profile: u.photo_profile,
    created_at: u.created_at
  }))
  res.json(users)
})

// Register
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body
  const data = await fs.readJson(DATA_FILE)

  if (data.users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'Username already exists' })
  }

  const newUser = {
    uid: uuidv4(),
    username,
    password,
    photo_profile: '',
    created_at: Date.now()
  }

  data.users.push(newUser)
  await fs.writeJson(DATA_FILE, data, { spaces: 2 })

  res.json({ success: true, uid: newUser.uid })
})

// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body
  const data = await fs.readJson(DATA_FILE)

  const user = data.users.find(u => u.username === username && u.password === password)
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  res.json({ success: true, uid: user.uid })
})

// GET all chats
app.get('/api/chats', async (req, res) => {
  const data = await fs.readJson(DATA_FILE)
  res.json(data.chats)
})

// Send chat
app.post('/api/chat', async (req, res) => {
  const { from, to, message } = req.body
  if (!from || !to || !message) {
    return res.status(400).json({ error: 'Missing fields' })
  }

  const data = await fs.readJson(DATA_FILE)

  const chat = {
    from,
    to,
    message,
    timestamp: Date.now()
  }

  data.chats.push(chat)
  await fs.writeJson(DATA_FILE, data, { spaces: 2 })

  res.json({ success: true })
})

// Run server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})

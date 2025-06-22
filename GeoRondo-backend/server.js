const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

app.use(cors({
  origin: ['http://localhost:5174', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { username, password: hashed }
    });
    res.json({ message: 'User created' });
  } catch (err) {
    res.status(400).json({ error: 'Username taken' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await prisma.user.findUnique({ where: { username } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ userId: user.id, username }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token, username });
});

function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = user;
    next();
  });
}
app.post('/submit', authenticateToken, async (req, res) => {
  const { score, time } = req.body;
  let { difficulty } = req.body;
  const { userId } = req.user;

  if (difficulty === 'daily') {
    const today = new Date().toISOString().slice(0, 10);
    difficulty = `daily-${today}`;
  }
  try {
    const existingScore = await prisma.score.findFirst({
      where: {
        userId: userId,
        difficulty: difficulty,
      },
    });

    if (existingScore) {
      if (score > existingScore.score || (score === existingScore.score && time < existingScore.time)) {
        await prisma.score.update({
          where: { id: existingScore.id },
          data: { score, time },
        });
        return res.json({ message: 'Leaderboard score updated!' });
      } else {
        return res.json({ message: 'Existing score is better, not updated.' });
      }
    } else {
      await prisma.score.create({
        data: {
          score,
          time,
          difficulty,
          userId: userId,
        },
      });
      return res.json({ message: 'Score submitted!' });
    }
  } catch (err) {
    console.error("Score submission error:", err);
    res.status(500).json({ error: 'Failed to submit score.' });
  }
});

app.get('/leaderboard', async (req, res) => {
  let { difficulty } = req.query;

  if (difficulty === 'daily') {
    const today = new Date().toISOString().slice(0, 10);
    difficulty = `daily-${today}`;
  }

  try {
    const scores = await prisma.score.findMany({
      where: { difficulty },
      orderBy: [{ score: 'desc' }, { time: 'asc' }],
      take: 10,
      include: { user: true }
    });

    res.json(scores.map((entry, i) => ({
      rank: i + 1,
      username: entry.user.username,
      score: entry.score,
      time: entry.time
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

app.get('/dev/clear-scores/:secret', async (req, res) => {
  const { secret } = req.params;
  if (secret !== 'geo-rondo-rocks') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    await prisma.score.deleteMany({});
    res.send('<h1>All scores have been deleted. You can close this tab.</h1>');
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear scores.' });
  }
});

app.get('/test', (req, res) => {
  res.send('Backend is working!');
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// import { execSync } from "child_process";
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { OAuth2Client } = require('google-auth-library');
const { Server } = require('socket.io');
const http = require('http');
require('dotenv').config();

// async function main() {
//   try {
//     console.log("Running Prisma migrations...");
//     execSync("npx prisma migrate deploy", { stdio: "inherit" });
//   } catch (err) {
//     console.error("Migration failed:", err);
//   }

//   // then start your server normally
//   app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
//   });
// }

// main();
// Import questions from frontend
const questionBank = require('./questions');

const app = express();
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Allowed origins:', getAllowedOrigins());
const server = http.createServer(app);

// Define getAllowedOrigins function FIRST
const getAllowedOrigins = () => {
  if (process.env.NODE_ENV === 'production') {
    const list = process.env.FRONTEND_URL || 'https://georondo.com,https://www.georondo.com';
    return list.split(',').map(s => s.trim());
  }
  return ['http://localhost:5173', 'http://localhost:5174'];
};
const allowedOrigins = getAllowedOrigins();
// NOW use the function in Socket.io setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);
const rooms = new Map();

// Use the function in Express CORS setup too
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

app.post('/auth/google', async (req, res) => {
  const { token } = req.body;
  console.log('Google auth request received'); // Debug log
  
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;
    
    console.log('Google payload:', { googleId, email, name }); // Debug log
    
    // Find or create user
    let user = await prisma.user.findUnique({
      where: { googleId }
    });
    
    if (!user) {
      console.log('Creating new user'); // Debug log
      user = await prisma.user.create({
        data: {
          googleId,
          email,
          name,
          picture
        }
      });
    } else {
      console.log('Updating existing user'); // Debug log
      // Update user info in case it changed
      user = await prisma.user.update({
        where: { googleId },
        data: {
          email,
          name,
          picture
        }
      });
    }
    
    console.log('Final user data:', user); // Debug log
    
    // Make sure to return the user data correctly
    res.json({
      success: true,
      username: user.name || user.email || 'GoogleUser', // For backwards compatibility
      user: {
        id: user.id,           // This is the database ID needed for score submission
        googleId: user.googleId,
        email: user.email,
        name: user.name,
        picture: user.picture
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ error: 'Invalid Google token' });
  }
});
// --- Submit Score ---
app.post('/submit', async (req, res) => {
  const { score, time, difficulty, userId } = req.body;
  
  let finalDifficulty = difficulty;
  if (difficulty === 'daily') {
    const today = new Date().toISOString().slice(0, 10);
    finalDifficulty = `daily-${today}`;
  }

  try {
    const existingScore = await prisma.score.findFirst({
      where: { userId: parseInt(userId), difficulty: finalDifficulty }
    });

    if (existingScore) {
      if (score > existingScore.score || (score === existingScore.score && time < existingScore.time)) {
        await prisma.score.update({
          where: { id: existingScore.id },
          data: { score, time }
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
          difficulty: finalDifficulty, 
          userId: parseInt(userId) 
        } 
      });
      return res.json({ message: 'Score submitted!' });
    }
  } catch (err) {
    console.error("Score submission error:", err);
    res.status(500).json({ error: 'Failed to submit score.' });
  }
});

// Replace your current /leaderboard endpoint with this:

app.get('/leaderboard', async (req, res) => {
  let { difficulty } = req.query;
  console.log('Leaderboard request for difficulty:', difficulty); // Debug log

  if (difficulty === 'daily') {
    const today = new Date().toISOString().slice(0, 10);
    difficulty = `daily-${today}`;
    console.log('Daily difficulty converted to:', difficulty); // Debug log
  }

  try {
    console.log('Querying database for difficulty:', difficulty); // Debug log
    
    const scores = await prisma.score.findMany({
      where: { difficulty },
      orderBy: [{ score: 'desc' }, { time: 'asc' }],
      take: 10,
      include: { user: true }
    });

    console.log(`Found ${scores.length} scores for ${difficulty}:`, scores); // Debug log

    const formattedScores = scores.map((entry, i) => ({
      rank: i + 1,
      username: entry.user.name || entry.user.email || 'Unknown User',
      score: entry.score,
      time: entry.time
    }));

    console.log('Formatted scores:', formattedScores); // Debug log

    res.json(formattedScores);
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('create-room', (data) => {
    const { username, difficulty } = data;
    const roomCode = generateRoomCode();

    const room = {
      code: roomCode,
      host: username,
      players: [{ username, socketId: socket.id, ready: false, score: 0, finished: false }],
      difficulty,
      gameStarted: false,
      currentQuestionIndex: 0,
      questions: [],
      gameState: 'waiting'
    };

    rooms.set(roomCode, room);
    socket.join(roomCode);
    socket.emit('room-created', { roomCode, room });
    console.log(`Room ${roomCode} created by ${username}`);
  });

  socket.on('join-room', (data) => {
    const { roomCode, username } = data;
    const room = rooms.get(roomCode);
    if (!room) return socket.emit('room-error', { message: 'Room not found' });
    if (room.gameStarted) return socket.emit('room-error', { message: 'Game already started' });
    if (room.players.length >= 4) return socket.emit('room-error', { message: 'Room full' });
    if (room.players.some(p => p.username === username)) {
      return socket.emit('room-error', { message: 'Username already taken' });
    }

    room.players.push({ username, socketId: socket.id, ready: false, score: 0, finished: false });
    socket.join(roomCode);
    io.to(roomCode).emit('player-joined', { room });
    console.log(`${username} joined room ${roomCode}`);
  });

  socket.on('update-difficulty', (data) => {
    const { roomCode, difficulty } = data;
    const room = rooms.get(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player || player.username !== room.host) return;

    room.difficulty = difficulty;
    io.to(roomCode).emit('room-updated', { room });
  });

  socket.on('reset-room', (data) => {
    const { roomCode } = data;
    const room = rooms.get(roomCode);
    if (!room) return;

    // Reset all player states for a new game, but preserve socketId
    room.players.forEach(player => {
      player.ready = false;
      player.finished = false;
      player.finalScore = 0;
      player.timeUsed = 0;
      player.playerAnswers = [];
      player.score = 0;
      // Keep socketId intact so players can still be identified
    });

    // Update the current player's socketId to ensure they can be identified
    const currentPlayer = room.players.find(p => p.socketId === socket.id);
    if (currentPlayer) {
      currentPlayer.socketId = socket.id;
    }

    // Reset room game state
    room.gameStarted = false;
    room.gameState = 'waiting';
    room.questions = null;
    room.currentQuestionIndex = 0;

    io.to(roomCode).emit('room-updated', { room });
  });

  socket.on('toggle-ready', (data) => {
    const { roomCode } = data;
    const room = rooms.get(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (player) {
      player.ready = !player.ready;
      const allReady = room.players.every(p => p.ready) && room.players.length >= 2;
      room.gameState = allReady ? 'ready' : 'waiting';
      io.to(roomCode).emit('room-updated', { room });
    }
  });

  socket.on('start-game', (data) => {
    const { roomCode } = data;
    const room = rooms.get(roomCode);
    if (!room || room.gameStarted) return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player || player.username !== room.host) return;

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    room.questions = alphabet.map(letter => {
      const pool = (questionBank[letter] || []).filter(q => q.difficulty === room.difficulty);
      if (pool.length > 0) {
        return pool[Math.floor(Math.random() * pool.length)];
      } else {
        // Fallback to any difficulty if no questions match the selected difficulty
        const allPool = questionBank[letter] || [];
        return allPool.length > 0 ? allPool[Math.floor(Math.random() * allPool.length)] : {
          question: `Name a place that starts with "${letter}"`,
          correctAnswers: ['Any answer'],
          difficulty: room.difficulty
        };
      }
    });

    room.gameStarted = true;
    room.gameState = 'playing';
    room.currentQuestionIndex = 0;

    io.to(roomCode).emit('game-started', {
      room,
      currentQuestion: room.questions[0],
      letter: alphabet[0]
    });
  });

  socket.on('submit-answer', (data) => {
    const { roomCode, answer, questionIndex } = data;
    const room = rooms.get(roomCode);
    if (!room || !room.gameStarted) return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;

    const currentQuestion = room.questions[questionIndex];
    const isCorrect = currentQuestion.correctAnswers.some(
      correct => correct.toLowerCase() === answer.toLowerCase()
    );

    if (isCorrect) player.score++;

    io.to(roomCode).emit('player-answered', {
      username: player.username,
      answer,
      isCorrect,
      currentScores: room.players.map(p => ({ username: p.username, score: p.score }))
    });
  });

  socket.on('player-finished', (data) => {
    const { roomCode, finalScore, timeUsed } = data;
    const room = rooms.get(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (player) {
      player.finished = true;
      player.finalScore = finalScore;
      player.timeUsed = timeUsed;
      player.playerAnswers = data.answers || [];

      const allFinished = room.players.every(p => p.finished);
      if (allFinished) {
        room.gameState = 'finished';
        const results = room.players
          .map(p => ({
            username: p.username,
            score: p.finalScore,
            timeUsed: p.timeUsed,
            playerAnswers: p.playerAnswers || []
          }))
          .sort((a, b) => b.score - a.score || a.timeUsed - b.timeUsed);

        io.to(roomCode).emit('game-finished', { results });
      } else {
        io.to(roomCode).emit('player-finished-update', {
          finishedPlayers: room.players.filter(p => p.finished).map(p => p.username)
        });
      }
    }
  });

  socket.on('leave-room', (data) => {
    const { roomCode } = data;
    const room = rooms.get(roomCode);
    if (room) {
      room.players = room.players.filter(p => p.socketId !== socket.id);
      if (room.players.length === 0) {
        rooms.delete(roomCode);
        console.log(`Room ${roomCode} deleted`);
      } else {
        const leavingPlayer = room.players.find(p => p.socketId === socket.id);
        if (leavingPlayer?.username === room.host) {
          room.host = room.players[0].username;
        }
        socket.leave(roomCode);
        io.to(roomCode).emit('player-left', { room });
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('Disconnected:', socket.id);
    rooms.forEach((room, roomCode) => {
      const idx = room.players.findIndex(p => p.socketId === socket.id);
      if (idx !== -1) {
        const leavingPlayer = room.players[idx];
        room.players.splice(idx, 1);

        if (room.players.length === 0) {
          rooms.delete(roomCode);
        } else {
          if (leavingPlayer.username === room.host) {
            room.host = room.players[0].username;
          }
          io.to(roomCode).emit('player-left', { room });
        }
      }
    });
  });
});

app.get('/test', (req, res) => {
  res.send('Backend is working!');
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

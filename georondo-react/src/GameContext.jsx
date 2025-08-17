import React, { createContext, useContext, useState, useEffect } from 'react';
import io from 'socket.io-client';
import questionBank from './questions';
import config from './config/environment.js';

export const GameContext = createContext();

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

// ==== Daily helpers (UTC so everyone shares the same "day") ====
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAILY_EPOCH = { y: 2025, m: 0, d: 1 }; // 2025-01-01 (UTC)

function getUtcDayIndex(date = new Date()) {
  const todayUTC = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const epochUTC = Date.UTC(DAILY_EPOCH.y, DAILY_EPOCH.m, DAILY_EPOCH.d);
  return Math.floor((todayUTC - epochUTC) / MS_PER_DAY);
}

export const GameProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [currentView, setCurrentView] = useState('start');
  const [selectedDifficulty, setSelectedDifficulty] = useState('easy');

  const [alphabet] = useState('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''));
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [playerAnswers, setPlayerAnswers] = useState([]);
  const [skipsRemaining, setSkipsRemaining] = useState(3);
  const [totalTime, setTotalTime] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [skippedLetters, setSkippedLetters] = useState([]);
  const [savedSkippedQuestions, setSavedSkippedQuestions] = useState([]);
  const [skipMode, setSkipMode] = useState(false);
  const [multiplayerRoom, setMultiplayerRoom] = useState(null);
  const [multiplayerResults, setMultiplayerResults] = useState(null);
  const [multiplayerMode, setMultiplayerMode] = useState(null);
  const [gameOverData, setGameOverData] = useState(null);

  // Daily mode seed: null = not in daily mode
  const [dailySeed, setDailySeed] = useState(null);

  useEffect(() => {
    const newSocket = io(config.SOCKET_URL);
    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  useEffect(() => {
    let timer;
    if (gameActive && totalTime > 0) {
      timer = setInterval(() => {
        setTotalTime(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameActive, totalTime]);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setCurrentView('start');
  };

  const handleGoogleSignIn = async (response) => {
    try {
      const res = await fetch(`${config.API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: response.credential }),
      });
      if (res.ok) {
        const data = await res.json();
        const userObject = {
          id: data.user.id, // DB ID for score submission
          username: data.user.name || data.user.email || 'GoogleUser',
          email: data.user.email,
          name: data.user.name,
          picture: data.user.picture
        };
        setUser(userObject);
        localStorage.setItem('user', JSON.stringify(userObject));
      } else {
        console.error('Google sign-in failed');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
    }
  };

  const submitScore = async (score, timeUsed, difficulty) => {
    if (!user || !user.id) {
      console.log('No user or user ID for score submission');
      return;
    }
    try {
      const response = await fetch(`${config.API_URL}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score,
          time: timeUsed,
          difficulty,
          userId: user.id
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Score submission result:', result);
      } else {
        console.error('Score submission failed:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Score submission error:', error);
    }
  };

  // ============ Game setup (normal) ============
  const startGame = () => {
    setDailySeed(null); // ensure normal mode
    setCurrentView('game');
    setGameActive(true);
    setCurrentLetterIndex(0);
    setPlayerAnswers([]);
    setSkipsRemaining(3);
    setTotalTime(150);
    setSkippedLetters([]);
    setSavedSkippedQuestions([]);
    setSkipMode(false);
    setGameOverData(null);
    setCurrentQuestion(getQuestionForLetter(alphabet[0]));
  };

  // ============ Game setup (daily deterministic) ============
  const startDailyChallenge = () => {
    const seed = getUtcDayIndex();          // today's deterministic seed
    setSelectedDifficulty('daily');         // backend maps to daily-YYYY-MM-DD
    setDailySeed(seed);

    setCurrentView('game');
    setGameActive(true);
    setCurrentLetterIndex(0);
    setPlayerAnswers([]);
    setSkipsRemaining(3);
    setTotalTime(150);
    setSkippedLetters([]);
    setSavedSkippedQuestions([]);
    setSkipMode(false);
    setGameOverData(null);

    setCurrentQuestion(getDailyQuestionForLetter(alphabet[0], seed));
  };

  // ============ Answering / Progression ============
  const handleSubmit = (answer) => {
    if (!gameActive || !currentQuestion) return;

    const isCorrect = currentQuestion.correctAnswers.some(
      correct => correct.toLowerCase() === answer.toLowerCase()
    );

    const newEntry = {
      letter: alphabet[currentLetterIndex],
      question: currentQuestion.question,
      userAnswer: answer,
      wasCorrect: isCorrect,
      correctAnswers: currentQuestion.correctAnswers
    };

    const isFinalZ = !skipMode && currentLetterIndex === alphabet.length - 1 && skippedLetters.length === 0;
    const isFinalSkipped = skipMode && skippedLetters.length === 0;

    setPlayerAnswers(prev => [...prev, newEntry]);

    if (isFinalZ || isFinalSkipped) {
      setTimeout(() => endGame(), 0);
    } else {
      setNextQuestion();
    }
  };

  const handleSkip = () => {
    if (!gameActive || skipsRemaining <= 0) return;

    setPlayerAnswers(prev => [
      ...prev,
      {
        letter: alphabet[currentLetterIndex],
        question: currentQuestion.question,
        userAnswer: '',
        wasCorrect: false,
        correctAnswers: currentQuestion.correctAnswers
      }
    ]);

    setSkippedLetters(prev => [...prev, currentLetterIndex]);
    setSavedSkippedQuestions(prev => [...prev, currentQuestion]);
    setSkipsRemaining(prev => prev - 1);

    setNextQuestion();
  };

  const setNextQuestion = () => {
    const nextIndex = currentLetterIndex + 1;

    if (!skipMode && nextIndex < alphabet.length) {
      // Regular progression
      setCurrentLetterIndex(nextIndex);
      if (selectedDifficulty === 'daily' && dailySeed !== null) {
        setCurrentQuestion(getDailyQuestionForLetter(alphabet[nextIndex], dailySeed));
      } else {
        setCurrentQuestion(getQuestionForLetter(alphabet[nextIndex]));
      }
    } else if (!skipMode && nextIndex >= alphabet.length && skippedLetters.length > 0) {
      // Entering skip mode after Z
      setSkipMode(true);
      const [firstSkipped, ...restSkipped] = skippedLetters;
      const [firstQuestion, ...restQuestions] = savedSkippedQuestions;
      setCurrentLetterIndex(firstSkipped);
      setCurrentQuestion(firstQuestion);
      setSkippedLetters(restSkipped);
      setSavedSkippedQuestions(restQuestions);
    } else if (skipMode && skippedLetters.length > 0) {
      // Continue skipped questions
      const [nextSkipped, ...restSkipped] = skippedLetters;
      const [nextQuestion, ...restQuestions] = savedSkippedQuestions;
      setCurrentLetterIndex(nextSkipped);
      setCurrentQuestion(nextQuestion);
      setSkippedLetters(restSkipped);
      setSavedSkippedQuestions(restQuestions);
    } else {
      // All questions completed, including skips
      endGame();
    }
  };

  // ============ Question selection ============
  const getQuestionForLetter = (letter) => {
    const pool = questionBank[letter]?.filter(q => q.difficulty === selectedDifficulty);
    if (!pool || pool.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
  };

  function getDailyQuestionForLetter(letter, seed) {
    const all = questionBank[letter] || [];
    if (all.length === 0) {
      return {
        question: `Name a place that starts with "${letter}"`,
        correctAnswers: ['Any answer'],
        difficulty: 'daily'
      };
    }
    // Deterministic index for the day (same for everyone)
    const idx = ((seed % all.length) + all.length) % all.length;
    return all[idx];
  }

  // ============ End game / submit ============
  const endGame = () => {
    setGameActive(false);

    // Calculate game stats
    const totalTimeUsed = 150 - totalTime;
    const finalScore = playerAnswers.filter(answer => answer.wasCorrect).length;

    setGameOverData({ totalTimeUsed });

    // Submit score to leaderboard if user is logged in
    if (user && user.id) {
      submitScore(finalScore, totalTimeUsed, selectedDifficulty);
    }
  };

  const value = {
    user,
    setUser,
    socket,
    currentView,
    setCurrentView,
    selectedDifficulty,
    setSelectedDifficulty,
    alphabet,
    currentLetterIndex,
    playerAnswers,
    skipsRemaining,
    totalTime,
    setTotalTime,
    gameActive,
    currentQuestion,
    skippedLetters,
    skipMode,
    multiplayerRoom,
    setMultiplayerRoom,
    multiplayerResults,
    setMultiplayerResults,
    multiplayerMode,
    setMultiplayerMode,
    gameOverData,
    handleGoogleSignIn,
    logout,
    startGame,
    startDailyChallenge, // <-- used by your Daily button
    handleSubmit,
    handleSkip,
    setNextQuestion,
    endGame
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

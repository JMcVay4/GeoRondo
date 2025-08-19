import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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

// ==== Daily helpers (UTC) ====
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAILY_EPOCH = { y: 2025, m: 0, d: 1 }; // 2025-01-01 (UTC)

function getUtcDayIndex(date = new Date()) {
  const todayUTC = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const epochUTC = Date.UTC(DAILY_EPOCH.y, DAILY_EPOCH.m, DAILY_EPOCH.d);
  return Math.floor((todayUTC - epochUTC) / MS_PER_DAY);
}
function todayUtcYmd() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
const DAILY_PLAY_KEY = (ymd) => `georondo_daily_${ymd}`;

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

  // === Skip queue (state + refs to avoid stale reads) ===
  const [skippedLetters, setSkippedLetters] = useState([]);              // indices (FIFO)
  const [savedSkippedQuestions, setSavedSkippedQuestions] = useState([]); // questions (FIFO)
  const skippedLettersRef = useRef([]);            // mirrors state, always freshest
  const savedSkippedQuestionsRef = useRef([]);     // mirrors state, always freshest

  const [skipMode, setSkipMode] = useState(false);
  const [multiplayerRoom, setMultiplayerRoom] = useState(null);
  const [multiplayerResults, setMultiplayerResults] = useState(null);
  const [multiplayerMode, setMultiplayerMode] = useState(null);
  const [gameOverData, setGameOverData] = useState(null);

  const [dailySeed, setDailySeed] = useState(null);

  // keep refs mirrored to state
  useEffect(() => { skippedLettersRef.current = skippedLetters; }, [skippedLetters]);
  useEffect(() => { savedSkippedQuestionsRef.current = savedSkippedQuestions; }, [savedSkippedQuestions]);

  // socket
  useEffect(() => {
    const newSocket = io(config.SOCKET_URL);
    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  // timer
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

  // restore user
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
        body: JSON.stringify({ token: response.credential } ),
      });
      if (res.ok) {
        const data = await res.json();
        const userObject = {
          id: data.user.id,
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
        body: JSON.stringify({ score, time: timeUsed, difficulty, userId: user.id })
      });
      if (!response.ok) {
        console.error('Score submission failed:', response.status);
      }
    } catch (error) {
      console.error('Score submission error:', error);
    }
  };

  // ---- Normal single-player
  const startGame = () => {
    setDailySeed(null);
    setCurrentView('game');
    setGameActive(true);
    setCurrentLetterIndex(0);
    setPlayerAnswers([]);
    setSkipsRemaining(3);
    setTotalTime(150);

    // reset skip queue (state + refs)
    setSkippedLetters([]);
    setSavedSkippedQuestions([]);
    skippedLettersRef.current = [];
    savedSkippedQuestionsRef.current = [];

    setSkipMode(false);
    setGameOverData(null);
    setCurrentQuestion(getQuestionForLetter(alphabet[0]));
  };

  // ---- Daily (deterministic, once per UTC day)
  const startDailyChallenge = () => {
    const today = todayUtcYmd();
    const key = DAILY_PLAY_KEY(today);
    if (localStorage.getItem(key) === 'played') {
      window.alert('You’ve already played today’s Daily Challenge. Come back after UTC midnight!');
      setCurrentView('start');
      return;
    }
    const seed = getUtcDayIndex();
    setSelectedDifficulty('daily');
    setDailySeed(seed);

    setCurrentView('game');
    setGameActive(true);
    setCurrentLetterIndex(0);
    setPlayerAnswers([]);
    setSkipsRemaining(3);
    setTotalTime(150);

    // reset skip queue (state + refs)
    setSkippedLetters([]);
    setSavedSkippedQuestions([]);
    skippedLettersRef.current = [];
    savedSkippedQuestionsRef.current = [];

    setSkipMode(false);
    setGameOverData(null);
    setCurrentQuestion(getDailyQuestionForLetter(alphabet[0], seed));
  };

  // ---- Submit / Skip (replace per-letter record)
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

    // replace any existing record for this letter
    setPlayerAnswers(prev => {
      const filtered = prev.filter(a => a.letter !== alphabet[currentLetterIndex]);
      return [...filtered, newEntry];
    });

    // Are we on the last letter to be answered?
    const isFinalZ =
      !skipMode &&
      currentLetterIndex === alphabet.length - 1 &&
      skippedLettersRef.current.length === 0;

    const isFinalSkipped =
      skipMode &&
      skippedLettersRef.current.length === 0;

    if (isFinalZ || isFinalSkipped) {
      // let the circle paint its final color before summary
      setTimeout(() => endGame(), 180);
    } else {
      setNextQuestion();
    }
  };

  const handleSkip = () => {
    if (!gameActive || skipsRemaining <= 0) return;

    // record a "skip" answer for this letter
    const skipEntry = {
      letter: alphabet[currentLetterIndex],
      question: currentQuestion.question,
      userAnswer: '',
      wasCorrect: false,
      correctAnswers: currentQuestion.correctAnswers
    };

    setPlayerAnswers(prev => {
      const filtered = prev.filter(a => a.letter !== alphabet[currentLetterIndex]);
      return [...filtered, skipEntry];
    });

    // push onto FIFO queue using refs to avoid races
    const nextLetters = [...skippedLettersRef.current, currentLetterIndex];
    const nextQuestions = [...savedSkippedQuestionsRef.current, currentQuestion];

    skippedLettersRef.current = nextLetters;
    savedSkippedQuestionsRef.current = nextQuestions;

    setSkippedLetters(nextLetters);
    setSavedSkippedQuestions(nextQuestions);

    setSkipsRemaining(prev => prev - 1);
    setNextQuestion();
  };

  // ---- Progression (supports skip-mode) — uses REF queues to avoid stale state
  const setNextQuestion = () => {
    const nextIndex = currentLetterIndex + 1;

    // 1) Regular progression A..Z
    if (!skipMode && nextIndex < alphabet.length) {
      setCurrentLetterIndex(nextIndex);
      if (selectedDifficulty === 'daily' && dailySeed !== null) {
        setCurrentQuestion(getDailyQuestionForLetter(alphabet[nextIndex], dailySeed));
      } else {
        setCurrentQuestion(getQuestionForLetter(alphabet[nextIndex]));
      }
      return;
    }

    // 2) End of alphabet: enter skip mode if any were skipped
    if (!skipMode && nextIndex >= alphabet.length) {
      const sk = skippedLettersRef.current;
      const sq = savedSkippedQuestionsRef.current;
      if (sk.length > 0) {
        const firstSkipped = sk[0];
        const firstQuestion = sq[0];
        const restSkipped = sk.slice(1);
        const restQuestions = sq.slice(1);

        // update queues (refs + state) BEFORE switching
        skippedLettersRef.current = restSkipped;
        savedSkippedQuestionsRef.current = restQuestions;
        setSkippedLetters(restSkipped);
        setSavedSkippedQuestions(restQuestions);

        setSkipMode(true);
        setCurrentLetterIndex(firstSkipped);
        setCurrentQuestion(firstQuestion);
        return;
      }
      endGame();
      return;
    }

    // 3) Continue skip mode (FIFO)
    if (skipMode) {
      const sk = skippedLettersRef.current;
      const sq = savedSkippedQuestionsRef.current;
      if (sk.length > 0) {
        const nextSkipped = sk[0];
        const nextQuestion = sq[0];
        const restSkipped = sk.slice(1);
        const restQuestions = sq.slice(1);

        skippedLettersRef.current = restSkipped;
        savedSkippedQuestionsRef.current = restQuestions;
        setSkippedLetters(restSkipped);
        setSavedSkippedQuestions(restQuestions);

        setCurrentLetterIndex(nextSkipped);
        setCurrentQuestion(nextQuestion);
        return;
      }
      endGame();
      return;
    }
  };

  // ---- Question selection
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
    const idx = ((seed % all.length) + all.length) % all.length;
    return all[idx];
  }

  // ---- End game
  const endGame = () => {
    setGameActive(false);

    const totalTimeUsed = 150 - totalTime;
    const finalScore = playerAnswers.filter(answer => answer.wasCorrect).length;

    setGameOverData({ totalTimeUsed });

    // daily lock: mark played
    if (selectedDifficulty === 'daily') {
      try {
        localStorage.setItem(DAILY_PLAY_KEY(todayUtcYmd()), 'played');
      } catch {}
    }

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
    startDailyChallenge,
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

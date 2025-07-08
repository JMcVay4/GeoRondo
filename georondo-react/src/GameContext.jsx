import React, { createContext, useContext, useState, useEffect } from 'react';
import questionBank from './questions';
import { jwtDecode } from 'jwt-decode';

export const GameContext = createContext(null);
const getTodayDateString = () => {
  const today = new Date();
  return today.toISOString().slice(0, 10); 
};
const getTodayIndex = () => {
  const today = new Date();
  const start = new Date("2025-01-01");
  return Math.floor((today - start) / (1000 * 60 * 60 * 24));
};

const getDailyQuestions = () => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const index = getTodayIndex();
  return alphabet.map(letter => {
    const pool = (questionBank[letter] || []).filter(q => q.difficulty === 'easy');
    return pool.length > 0 ? pool[index % pool.length] : {
      question: `No question for ${letter}`,
      correctAnswers: [''],
      difficulty: 'easy'
    };
  });
};

export const GameProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [alphabet] = useState('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''));
  const [selectedDifficulty, setSelectedDifficulty] = useState('easy');
  const [totalTime, setTotalTime] = useState(150);
  const [gameActive, setGameActive] = useState(false);
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [playerAnswers, setPlayerAnswers] = useState([]);
  const [skipsRemaining, setSkipsRemaining] = useState(3);
  const [skippedLetters, setSkippedLetters] = useState([]);
  const [savedSkippedQuestions, setSavedSkippedQuestions] = useState([]);
  const [skipMode, setSkipMode] = useState(false);
  const [dailyMode, setDailyMode] = useState(false);
  const [dailyQuestions, setDailyQuestions] = useState([]);
  const [gameOverData, setGameOverData] = useState(null);
  const [pendingScore, setPendingScore] = useState(null);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser({ username: decoded.username });
      } catch {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
      }
    }
  }, [token]);

  const login = async (username, password) => {
    const res = await fetch('http://localhost:3001/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser({ username: jwtDecode(data.token).username });

    if (pendingScore) {
      await submitScore(pendingScore.score, pendingScore.time, pendingScore.difficulty);
      setPendingScore(null);
    }
  };

  const register = async (username, password) => {
    const res = await fetch('http://localhost:3001/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const submitScore = async (score, time, difficulty) => {
    if (!token) {
      setPendingScore({ score, time, difficulty });
      return;
    }
    try {
      await fetch('http://localhost:3001/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ score, time, difficulty })
      });
    } catch (e) {
      console.error('Score submission failed:', e);
    }
  };
  const getRandomQuestion = (letter) => {
    const pool = (questionBank[letter] || []).filter(q => q.difficulty === selectedDifficulty);
    return pool[Math.floor(Math.random() * pool.length)];
  };
  const setNextQuestion = (
    index = currentLetterIndex,
    isDaily = dailyMode,
    dailyQs = dailyQuestions
  ) => {
    if (index >= alphabet.length) {
      if (skippedLetters.length > 0) {
        setSkipMode(true);
        setCurrentLetterIndex(skippedLetters[0]);
        setCurrentQuestion(savedSkippedQuestions[0]);
      } else {
        setCurrentQuestion(null);
        endGame();
      }
      return;
    }

    const letter = alphabet[index];
    const question = isDaily ? dailyQs[index] : getRandomQuestion(letter);
    setCurrentQuestion(question);
  };


const resetGameState = (isDaily = false) => {
  setCurrentLetterIndex(0);
  setSkipsRemaining(3);
  setPlayerAnswers([]);
  setTotalTime(150);
  setGameActive(true);
  setGameOverData(null);
  setSkippedLetters([]);
  setSavedSkippedQuestions([]);
  setSkipMode(false);
  setDailyMode(isDaily);
  if (isDaily) {
    const dailyQs = getDailyQuestions();
    setDailyQuestions(dailyQs);
    setNextQuestion(0, true, dailyQs); // pass dailyQs to avoid async issues
  } else {
    setNextQuestion(0, false, null);
  }
};

  const startGame = () => resetGameState(false);
  const startDailyChallenge = () => resetGameState(true);

 const handleSubmit = (input) => {
  if (!gameActive || !currentQuestion) return;
  const answer = input.trim();
  const isCorrect = currentQuestion.correctAnswers.some(
    correct => correct.toLowerCase() === answer.toLowerCase()
  );

  const entry = {
    letter: alphabet[currentLetterIndex],
    question: currentQuestion.question,
    userAnswer: answer,
    wasCorrect: isCorrect,
    correctAnswers: currentQuestion.correctAnswers,
  };

  setPlayerAnswers((prev) => [...prev, entry]);

  if (skipMode) {
    const newSkipped = skippedLetters.slice(1);
    const newSaved = savedSkippedQuestions.slice(1);
    setSkippedLetters(newSkipped);
    setSavedSkippedQuestions(newSaved);

    if (newSkipped.length > 0) {
      setCurrentLetterIndex(newSkipped[0]);
      setCurrentQuestion(newSaved[0]);
    } else {
      endGame(); // ✅ Ends game after last skipped question
    }
  } else {
    const nextIndex = currentLetterIndex + 1;
    setCurrentLetterIndex(nextIndex);
    setNextQuestion(nextIndex); // This will automatically handle switching to skip mode
  }
};

  const handleSkip = () => {
    if (!gameActive || skipsRemaining <= 0) return;
    const letter = alphabet[currentLetterIndex];
    setPlayerAnswers(prev => [...prev, {
      letter,
      question: currentQuestion.question,
      userAnswer: '',
      wasCorrect: false,
      correctAnswers: currentQuestion.correctAnswers
    }]);
    setSkippedLetters(prev => [...prev, currentLetterIndex]);
    setSavedSkippedQuestions(prev => [...prev, currentQuestion]);
    setSkipsRemaining(prev => prev - 1);

    const nextIndex = currentLetterIndex + 1;
    setCurrentLetterIndex(nextIndex);
    setNextQuestion(nextIndex);
  };
  const endGame = () => {
    setGameActive(false);
    setCurrentQuestion(null); 
    const score = playerAnswers.filter(a => a.wasCorrect).length;
    const timeUsed = 150 - totalTime;
    setGameOverData({ completed: score, totalTimeUsed: timeUsed });
    const difficulty = dailyMode ? 'daily' : selectedDifficulty;
    if (user?.username) submitScore(score, timeUsed, difficulty);
  };
  useEffect(() => {
    if (!gameActive) return;
    const interval = setInterval(() => {
      setTotalTime(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameActive]);
  
  return (
    <GameContext.Provider
      value={{
        token,
        user,
        login,
        logout,
        register,
        alphabet,
        selectedDifficulty,
        setSelectedDifficulty,
        startGame,
        startDailyChallenge,
        currentLetterIndex,
        totalTime,
        gameActive,
        currentQuestion,
        playerAnswers,
        handleSubmit,
        handleSkip,
        skipsRemaining,
        endGame,
        dailyMode,
        gameOverData
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
export const useGame = () => useContext(GameContext);

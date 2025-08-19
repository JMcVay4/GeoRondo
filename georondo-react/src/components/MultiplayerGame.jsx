// src/components/MultiplayerGame.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGame } from '../GameContext';
import LetterCircles from './LetterCircles';

function MultiplayerGame({ socket, room, onGameEnd }) {
  const { user } = useGame();

  const answerRef = useRef(null);
  const gameInitialized = useRef(false);

  // Answers (for summary + scoring)
  const [playerAnswers, setPlayerAnswers] = useState([]);
  const latestAnswersRef = useRef([]);
  useEffect(() => { latestAnswersRef.current = playerAnswers; }, [playerAnswers]);

  // === Skip queues: EXACTLY like single player ===
  const [skippedLetters, setSkippedLetters] = useState([]);              // indices (FIFO)
  const [savedSkippedQuestions, setSavedSkippedQuestions] = useState([]); // questions (FIFO)
  const skippedLettersRef = useRef([]);            // mirrors state, always freshest
  const savedSkippedQuestionsRef = useRef([]);     // mirrors state, always freshest

  // keep refs mirrored to state (EXACTLY like GameContext)
  useEffect(() => { skippedLettersRef.current = skippedLetters; }, [skippedLetters]);
  useEffect(() => { savedSkippedQuestionsRef.current = savedSkippedQuestions; }, [savedSkippedQuestions]);

  // Display/scoreboard
  const [playerScores, setPlayerScores] = useState({});
  const [finishedPlayers, setFinishedPlayers] = useState([]);

  // Game state
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [gameState, setGameState] = useState({
    currentQuestionIndex: 0,
    currentQuestion: null,
    currentLetter: 'A',
    timeLeft: 150,
    gameActive: true,
    skipsRemaining: 3,
    skipMode: false
  });

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // Init once per room
  useEffect(() => {
    if (!socket || !room || gameInitialized.current) return;

    if (room.questions?.length > 0) {
      setGameState(prev => ({
        ...prev,
        currentQuestion: room.questions[0],
        currentLetter: alphabet[0],
        currentQuestionIndex: 0
      }));
    }

    const scores = {};
    room.players?.forEach(p => { scores[p.username] = 0; });
    setPlayerScores(scores);

    // reset skip queue (state + refs) - EXACTLY like GameContext
    setSkippedLetters([]);
    setSavedSkippedQuestions([]);
    skippedLettersRef.current = [];
    savedSkippedQuestionsRef.current = [];

    gameInitialized.current = true;
  }, [socket, room, alphabet]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handlePlayerAnswered = (data) => {
      if (Array.isArray(data.currentScores)) {
        setPlayerScores(Object.fromEntries(data.currentScores.map(s => [s.username, s.score])));
      }
    };
    const handlePlayerFinished = (data) => setFinishedPlayers(data.finishedPlayers || []);
    const handleGameFinished = (data) => {
      setGameState(prev => ({ ...prev, gameActive: false }));
      onGameEnd(data.results);
    };

    socket.on('player-answered', handlePlayerAnswered);
    socket.on('player-finished-update', handlePlayerFinished);
    socket.on('game-finished', handleGameFinished);

    return () => {
      socket.off('player-answered', handlePlayerAnswered);
      socket.off('player-finished-update', handlePlayerFinished);
      socket.off('game-finished', handleGameFinished);
    };
  }, [socket, onGameEnd]);

  // Timer
  useEffect(() => {
    if (!gameState.gameActive) return;
    const timer = setInterval(() => {
      setGameState(prev => {
        if (prev.timeLeft <= 1) {
          clearInterval(timer);
          endGame();
          return { ...prev, timeLeft: 0, gameActive: false };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState.gameActive]);

  // Focus
  useEffect(() => {
    if (answerRef.current && gameState.gameActive) answerRef.current.focus();
  }, [gameState.currentQuestionIndex, gameState.gameActive]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // ---- Progression (COPIED EXACTLY from GameContext setNextQuestion)
  const setNextQuestion = () => {
    const nextIndex = gameState.currentQuestionIndex + 1;

    // 1) Regular progression A..Z
    if (!gameState.skipMode && nextIndex < alphabet.length) {
      setGameState(prev => ({
        ...prev,
        currentQuestionIndex: nextIndex,
        currentLetter: alphabet[nextIndex],
        currentQuestion: room?.questions?.[nextIndex] ?? null
      }));
      return;
    }

    // 2) End of alphabet: enter skip mode if any were skipped
    if (!gameState.skipMode && nextIndex >= alphabet.length) {
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

        setGameState(prev => ({
          ...prev,
          skipMode: true,
          currentQuestionIndex: firstSkipped,
          currentLetter: alphabet[firstSkipped],
          currentQuestion: firstQuestion
        }));
        return;
      }
      endGame(latestAnswersRef.current);
      return;
    }

    // 3) Continue skip mode (FIFO)
    if (gameState.skipMode) {
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

        setGameState(prev => ({
          ...prev,
          currentQuestionIndex: nextSkipped,
          currentLetter: alphabet[nextSkipped],
          currentQuestion: nextQuestion
        }));
        return;
      }
      endGame(latestAnswersRef.current);
      return;
    }
  };

  const submitAnswer = () => {
    if (!gameState.gameActive || !gameState.currentQuestion) return;
    const answer = currentAnswer.trim();
    if (!answer) return;

    if (['SKIP', 'PASS'].includes(answer.toUpperCase())) {
      handleSkip();
      return;
    }

    const isCorrect = gameState.currentQuestion.correctAnswers.some(
      correct => correct.toLowerCase() === answer.toLowerCase()
    );

    // replace record for this letter (EXACTLY like GameContext handleSubmit)
    const newEntry = {
      letter: gameState.currentLetter,
      question: gameState.currentQuestion.question,
      userAnswer: answer,
      wasCorrect: isCorrect,
      correctAnswers: gameState.currentQuestion.correctAnswers
    };

    setPlayerAnswers(prev => {
      const filtered = prev.filter(a => a.letter !== gameState.currentLetter);
      const final = [...filtered, newEntry];
      latestAnswersRef.current = final;
      return final;
    });

    if (socket) {
      socket.emit('submit-answer', {
        roomCode: room.code,
        answer,
        questionIndex: gameState.currentQuestionIndex
      });
    }

    setCurrentAnswer('');

    // Check if this is the final question - need to check AFTER we would dequeue
    // In skip mode: check if queue will be empty after this answer
    // In normal mode: check if we're at Z and queue is empty
    
    let isLastQuestion = false;
    
    if (gameState.skipMode) {
      // We just answered a skipped question - check if more remain
      isLastQuestion = skippedLettersRef.current.length === 0;
    } else {
      // We just answered a normal question - check if we're at Z and no skips remain
      isLastQuestion = gameState.currentQuestionIndex === alphabet.length - 1 && skippedLettersRef.current.length === 0;
    }

    if (isLastQuestion) {
      // let the circle paint its final color before summary
      setTimeout(() => endGame(latestAnswersRef.current), 180);
    } else {
      setNextQuestion();
    }
  };

  const handleSkip = () => {
    if (!gameState.gameActive || gameState.skipsRemaining <= 0) return;

    // record a "skip" answer for this letter (EXACTLY like GameContext)
    const skipEntry = {
      letter: gameState.currentLetter,
      question: gameState.currentQuestion.question,
      userAnswer: '',
      wasCorrect: false,
      correctAnswers: gameState.currentQuestion.correctAnswers
    };

    setPlayerAnswers(prev => {
      const filtered = prev.filter(a => a.letter !== gameState.currentLetter);
      const final = [...filtered, skipEntry];
      latestAnswersRef.current = final;
      return final;
    });

    // push onto FIFO queue using refs to avoid races (EXACTLY like GameContext)
    const nextLetters = [...skippedLettersRef.current, gameState.currentQuestionIndex];
    const nextQuestions = [...savedSkippedQuestionsRef.current, gameState.currentQuestion];

    skippedLettersRef.current = nextLetters;
    savedSkippedQuestionsRef.current = nextQuestions;

    setSkippedLetters(nextLetters);
    setSavedSkippedQuestions(nextQuestions);

    setGameState(prev => ({ ...prev, skipsRemaining: prev.skipsRemaining - 1 }));
    setCurrentAnswer('');
    setNextQuestion();
  };

  const endGame = (answersOverride = null) => {
    setGameState(prev => {
      if (!prev.gameActive) return prev;
      const answersToSend = answersOverride || latestAnswersRef.current || playerAnswers;
      const finalScore = (answersToSend || []).filter(a => a.wasCorrect).length;
      const timeUsed = 150 - prev.timeLeft;

      if (socket) {
        socket.emit('player-finished', {
          roomCode: room.code,
          finalScore,
          timeUsed,
          answers: answersToSend
        });
      }
      return { ...prev, gameActive: false };
    });
  };

  if (!gameState.gameActive) {
    const finalScore = (latestAnswersRef.current || playerAnswers).filter(a => a.wasCorrect).length;
    const timeUsed = 150 - gameState.timeLeft;
    return (
      <div className="flex flex-col items-center p-8 text-white">
        <h2 className="text-4xl font-bold mb-6">Game Finished!</h2>
        <div className="text-xl mb-4">Waiting for other players to finish...</div>
        <div className="mb-4">
          <p>Your Score: {finalScore}/26</p>
          <p>Time Used: {formatTime(timeUsed)}</p>
        </div>
        {finishedPlayers.length > 0 && (
          <div className="mb-4">
            <h3 className="text-lg font-bold mb-2">Finished Players:</h3>
            <ul className="text-center">
              {finishedPlayers.map((p, i) => (
                <li key={i} className="text-green-400">✅ {p}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="absolute top-28 left-4 bg-black/50 p-4 rounded-lg text-white z-10">
        <h3 className="font-bold mb-2">Live Scores</h3>
        {Object.entries(playerScores)
          .sort(([, a], [, b]) => b - a)
          .map(([username, score], index) => (
            <div
              key={username}
              className={`flex justify-between mb-1 ${username === user?.username ? 'text-yellow-400 font-bold' : ''}`}
            >
              <span>{index + 1}. {username}</span>
              <span>{score}</span>
            </div>
          ))}
      </div>

      <div className="game-container">
        <LetterCircles
          customCurrentLetterIndex={gameState.currentQuestionIndex}
          customPlayerAnswers={playerAnswers}
          customAlphabet={alphabet}
        />

        <div className="center-content">
          <div className="stats">
            <div className="timer">Time: {formatTime(gameState.timeLeft)}</div>
            <div className="skips">Skips: {gameState.skipsRemaining} remaining</div>
          </div>

          <div className="question-container">
            <div className="question">
              {gameState.currentQuestion?.question || 'Loading question...'}
            </div>
            <input
              type="text"
              id="answer-input"
              ref={answerRef}
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Type your answer here"
              disabled={!gameState.gameActive}
              onKeyDown={(e) => e.key === 'Enter' && submitAnswer()}
              className="text-white"
            />
          </div>

          <div className="button-container">
            <button
              id="skip-button"
              onClick={handleSkip}
              disabled={!gameState.gameActive || gameState.skipsRemaining <= 0}
            >
              Skip ({gameState.skipsRemaining} left)
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default MultiplayerGame;
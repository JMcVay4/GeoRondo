import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGame } from '../GameContext';
import LetterCircles from './LetterCircles';

function MultiplayerGame({ socket, room, onGameEnd }) {
  const { user } = useGame();
  const answerRef = useRef(null);
  const gameInitialized = useRef(false);
  
  // Core game state
  const [gameState, setGameState] = useState({
    currentQuestionIndex: 0,
    currentQuestion: null,
    currentLetter: 'A',
    timeLeft: 150,
    gameActive: true,
    skipsRemaining: 3,
    skipMode: false
  });
  
  // Game data
  const [playerScores, setPlayerScores] = useState({});
  const [playerAnswers, setPlayerAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [finishedPlayers, setFinishedPlayers] = useState([]);
  const [skippedLetters, setSkippedLetters] = useState([]);
  const [savedSkippedQuestions, setSavedSkippedQuestions] = useState([]);

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // Initialize game only once
  useEffect(() => {
    if (!socket || !room || gameInitialized.current) return;

    console.log('Initializing multiplayer game...', room);
    
    if (room.questions && room.questions.length > 0) {
      setGameState(prev => ({
        ...prev,
        currentQuestion: room.questions[0],
        currentLetter: alphabet[0],
        currentQuestionIndex: 0
      }));
    }

    // Initialize player scores
    const scores = {};
    if (room.players) {
      room.players.forEach(player => {
        scores[player.username] = 0;
      });
      setPlayerScores(scores);
    }

    gameInitialized.current = true;
  }, [socket, room]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handlePlayerAnswered = (data) => {
      console.log('Player answered:', data);
      if (data.currentScores) {
        setPlayerScores(prev => {
          const updated = { ...prev };
          data.currentScores.forEach(s => {
            updated[s.username] = s.score;
          });
          return updated;
        });
      }
    };

    const handlePlayerFinished = (data) => {
      console.log('Player finished:', data);
      setFinishedPlayers(data.finishedPlayers || []);
    };

    const handleGameFinished = (data) => {
      console.log('Game finished:', data);
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

  // Timer effect
  useEffect(() => {
    if (!gameState.gameActive) return;
    
    const timer = setInterval(() => {
      setGameState(prev => {
        if (prev.timeLeft <= 1) {
          endGame();
          return { ...prev, timeLeft: 0, gameActive: false };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [gameState.gameActive]);

  // Focus input when question changes
  useEffect(() => {
    if (answerRef.current && gameState.gameActive) {
      answerRef.current.focus();
    }
  }, [gameState.currentQuestionIndex, gameState.gameActive]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const moveToNextQuestion = useCallback(() => {
    console.log('Moving to next question. Current state:', {
      currentIndex: gameState.currentQuestionIndex,
      skipMode: gameState.skipMode,
      skippedLettersLength: skippedLetters.length
    });

    const nextIndex = gameState.currentQuestionIndex + 1;
    
    if (!gameState.skipMode && nextIndex < alphabet.length) {
      // Regular progression through alphabet
      const newQuestion = room.questions[nextIndex];
      const newLetter = alphabet[nextIndex];
      
      console.log('Regular progression:', { nextIndex, newLetter, newQuestion: newQuestion?.question });
      
      setGameState(prev => ({
        ...prev,
        currentQuestionIndex: nextIndex,
        currentLetter: newLetter,
        currentQuestion: newQuestion
      }));
      
    } else if (!gameState.skipMode && nextIndex >= alphabet.length && skippedLetters.length > 0) {
      // Finished alphabet, now do skipped questions
      const [firstSkipped, ...restSkipped] = skippedLetters;
      const [firstQuestion, ...restQuestions] = savedSkippedQuestions;
      
      console.log('Entering skip mode:', { firstSkipped, firstQuestion: firstQuestion?.question });
      
      setGameState(prev => ({
        ...prev,
        skipMode: true,
        currentQuestionIndex: firstSkipped,
        currentQuestion: firstQuestion,
        currentLetter: alphabet[firstSkipped]
      }));
      
      setSkippedLetters(restSkipped);
      setSavedSkippedQuestions(restQuestions);
      
    } else if (gameState.skipMode && skippedLetters.length > 0) {
      // Continue with remaining skipped questions
      const [nextSkipped, ...restSkipped] = skippedLetters;
      const [nextQuestion, ...restQuestions] = savedSkippedQuestions;
      
      console.log('Continuing skip mode:', { nextSkipped, nextQuestion: nextQuestion?.question });
      
      setGameState(prev => ({
        ...prev,
        currentQuestionIndex: nextSkipped,
        currentQuestion: nextQuestion,
        currentLetter: alphabet[nextSkipped]
      }));
      
      setSkippedLetters(restSkipped);
      setSavedSkippedQuestions(restQuestions);
      
    } else {
      // All questions completed
      console.log('All questions completed, ending game');
      endGame();
    }
  }, [gameState.currentQuestionIndex, gameState.skipMode, skippedLetters, savedSkippedQuestions, room.questions, alphabet]);

  const checkIfFinalQuestion = useCallback(() => {
    if (gameState.skipMode && skippedLetters.length === 0) {
      return true;
    }
    if (!gameState.skipMode && gameState.currentQuestionIndex === alphabet.length - 1 && skippedLetters.length === 0) {
      return true;
    }
    return false;
  }, [gameState.skipMode, gameState.currentQuestionIndex, skippedLetters.length]);

  const submitAnswer = () => {
    if (!gameState.gameActive || !gameState.currentQuestion) return;
    
    const answer = currentAnswer.trim();
    if (!answer) return;

    console.log('Submitting answer:', answer, 'for letter:', gameState.currentLetter);

    // Handle skip commands
    if (['SKIP', 'PASS'].includes(answer.toUpperCase())) {
      handleSkip();
      return;
    }

    // Check if answer is correct
    const isCorrect = gameState.currentQuestion.correctAnswers.some(
      correct => correct.toLowerCase() === answer.toLowerCase()
    );

    console.log('Answer is correct:', isCorrect);

    // Create answer entry
    const newEntry = {
      letter: gameState.currentLetter,
      question: gameState.currentQuestion.question,
      userAnswer: answer,
      wasCorrect: isCorrect,
      correctAnswers: gameState.currentQuestion.correctAnswers
    };

    // Update local state immediately
    const updatedAnswers = [...playerAnswers, newEntry];
    setPlayerAnswers(updatedAnswers);

    // Send answer to server
    if (socket) {
      socket.emit('submit-answer', {
        roomCode: room.code,
        answer,
        questionIndex: gameState.currentQuestionIndex,
        isCorrect
      });
    }

    // Clear input
    setCurrentAnswer('');

    // Check if game should end
    const isFinalQuestion = checkIfFinalQuestion();
    console.log('Is final question:', isFinalQuestion);
    
    if (isFinalQuestion) {
      setTimeout(() => endGame(updatedAnswers), 100);
    } else {
      moveToNextQuestion();
    }
  };

  const handleSkip = () => {
    if (!gameState.gameActive || gameState.skipsRemaining <= 0 || !gameState.currentQuestion) return;
    
    console.log('Skipping question for letter:', gameState.currentLetter);
    
    // Create skip entry
    const newEntry = {
      letter: gameState.currentLetter,
      question: gameState.currentQuestion.question,
      userAnswer: '',
      wasCorrect: false,
      correctAnswers: gameState.currentQuestion.correctAnswers
    };

    // Update state
    setPlayerAnswers(prev => [...prev, newEntry]);
    setSkippedLetters(prev => [...prev, gameState.currentQuestionIndex]);
    setSavedSkippedQuestions(prev => [...prev, gameState.currentQuestion]);
    setGameState(prev => ({ ...prev, skipsRemaining: prev.skipsRemaining - 1 }));
    setCurrentAnswer('');

    // Move to next question
    moveToNextQuestion();
  };

  const endGame = (answersOverride = null) => {
    if (!gameState.gameActive) return;
    
    console.log('Ending game');
    setGameState(prev => ({ ...prev, gameActive: false }));
    
    const answersToSend = answersOverride || playerAnswers;
    const finalScore = answersToSend.filter(a => a.wasCorrect).length;
    const timeUsed = 150 - gameState.timeLeft;
    
    if (socket) {
      socket.emit('player-finished', {
        roomCode: room.code,
        finalScore,
        timeUsed,
        answers: answersToSend
      });
    }
  };

  // Game finished screen
  if (!gameState.gameActive) {
    const finalScore = playerAnswers.filter(a => a.wasCorrect).length;
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
              {finishedPlayers.map((player, index) => (
                <li key={index} className="text-green-400">✅ {player}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Live Scores Panel */}
      <div className="absolute top-28 left-4 bg-black/50 p-4 rounded-lg text-white z-10">
        <h3 className="font-bold mb-2">Live Scores</h3>
        {Object.entries(playerScores)
          .sort(([, a], [, b]) => b - a)
          .map(([username, score], index) => (
            <div 
              key={username} 
              className={`flex justify-between mb-1 ${
                username === user?.username ? 'text-yellow-400 font-bold' : ''
              }`}
            >
              <span>{index + 1}. {username}</span>
              <span>{score}</span>
            </div>
          ))}
      </div>



      {/* Game Interface */}
      <div className="game-container">
        <LetterCircles 
          customCurrentLetterIndex={gameState.currentQuestionIndex}
          customPlayerAnswers={playerAnswers}
          customAlphabet={alphabet}
          customSkippedLetters={skippedLetters}
          customSkipMode={gameState.skipMode}
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
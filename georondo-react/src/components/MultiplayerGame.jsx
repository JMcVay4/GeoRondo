import React, { useEffect, useRef, useState } from 'react';
import { useGame } from '../GameContext';
import LetterCircles from './LetterCircles';

function MultiplayerGame({ socket, room, onGameEnd }) {
  const { user } = useGame();
  const answerRef = useRef(null);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentLetter, setCurrentLetter] = useState('A');
  const [timeLeft, setTimeLeft] = useState(150);
  const [playerScores, setPlayerScores] = useState({});
  const [playerAnswers, setPlayerAnswers] = useState([]);
  const [gameActive, setGameActive] = useState(true);
  const [skipsRemaining, setSkipsRemaining] = useState(3);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [finishedPlayers, setFinishedPlayers] = useState([]);
  const [skippedLetters, setSkippedLetters] = useState([]);
  const [savedSkippedQuestions, setSavedSkippedQuestions] = useState([]);
  const [skipMode, setSkipMode] = useState(false);

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  useEffect(() => {
    if (!socket) return;

    setCurrentQuestion(room.questions[0]);
    setCurrentLetter(alphabet[0]);

    const scores = {};
    room.players.forEach(player => {
      scores[player.username] = 0;
    });
    setPlayerScores(scores);

    socket.on('player-answered', (data) => {
      setPlayerScores(prev => {
        const updated = { ...prev };
        data.currentScores.forEach(s => {
          updated[s.username] = s.score;
        });
        return updated;
      });
    });

    socket.on('player-finished-update', (data) => {
      setFinishedPlayers(data.finishedPlayers);
    });

    socket.on('game-finished', (data) => {
      onGameEnd(data.results);
    });

    return () => {
      socket.off('player-answered');
      socket.off('player-finished-update');
      socket.off('game-finished');
    };
  }, [socket, room, onGameEnd]);

  useEffect(() => {
    if (!gameActive) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameActive]);

  useEffect(() => {
    if (answerRef.current && gameActive) {
      answerRef.current.focus();
    }
  }, [currentQuestionIndex, gameActive]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const submitAnswer = () => {
    if (!gameActive) return;
    const answer = currentAnswer.trim();
    if (!answer) return;

    if (answer.toUpperCase() === 'SKIP') {
      handleSkip();
      return;
    }

    const isCorrect = currentQuestion.correctAnswers.some(
      correct => correct.toLowerCase() === answer.toLowerCase()
    );

    const newEntry = {
      letter: currentLetter,
      question: currentQuestion.question,
      userAnswer: answer,
      wasCorrect: isCorrect,
      correctAnswers: currentQuestion.correctAnswers
    };

    // Check if this is the final question
    const isFinalZ = !skipMode && currentQuestionIndex === alphabet.length - 1 && skippedLetters.length === 0;
    const isFinalSkipped = skipMode && skippedLetters.length === 0;

    setPlayerAnswers(prev => [...prev, newEntry]);

    socket.emit('submit-answer', {
      roomCode: room.code,
      answer,
      questionIndex: currentQuestionIndex
    });

    if (isFinalZ || isFinalSkipped) {
      setTimeout(() => endGame([...playerAnswers, newEntry]), 0);
    } else {
      setCurrentAnswer('');
      moveToNextQuestion();
    }
  };

  const handleSkip = () => {
    if (!gameActive || skipsRemaining <= 0) return;
    
    const newEntry = {
      letter: currentLetter,
      question: currentQuestion.question,
      userAnswer: '',
      wasCorrect: false,
      correctAnswers: currentQuestion.correctAnswers
    };

    setPlayerAnswers(prev => [...prev, newEntry]);
    setSkippedLetters(prev => [...prev, currentQuestionIndex]);
    setSavedSkippedQuestions(prev => [...prev, currentQuestion]);
    setSkipsRemaining(prev => prev - 1);
    setCurrentAnswer('');
    moveToNextQuestion();
  };

  const moveToNextQuestion = () => {
    const nextIndex = currentQuestionIndex + 1;
    
    if (!skipMode && nextIndex < alphabet.length) {
      // Regular progression through alphabet
      setCurrentQuestionIndex(nextIndex);
      setCurrentQuestion(room.questions[nextIndex]);
      setCurrentLetter(alphabet[nextIndex]);
    } else if (!skipMode && nextIndex >= alphabet.length && skippedLetters.length > 0) {
      // Finished alphabet, now do skipped questions
      setSkipMode(true);
      const [firstSkipped, ...restSkipped] = skippedLetters;
      const [firstQuestion, ...restQuestions] = savedSkippedQuestions;
      setCurrentQuestionIndex(firstSkipped);
      setCurrentQuestion(firstQuestion);
      setCurrentLetter(alphabet[firstSkipped]);
      setSkippedLetters(restSkipped);
      setSavedSkippedQuestions(restQuestions);
    } else if (skipMode && skippedLetters.length > 0) {
      // Continue with remaining skipped questions
      const [nextSkipped, ...restSkipped] = skippedLetters;
      const [nextQuestion, ...restQuestions] = savedSkippedQuestions;
      setCurrentQuestionIndex(nextSkipped);
      setCurrentQuestion(nextQuestion);
      setCurrentLetter(alphabet[nextSkipped]);
      setSkippedLetters(restSkipped);
      setSavedSkippedQuestions(restQuestions);
    } else {
      // All questions completed
      endGame();
    }
  };

  const endGame = (answersOverride) => {
    setGameActive(false);
    const answersToSend = answersOverride || playerAnswers;
    const finalScore = answersToSend.filter(a => a.wasCorrect).length;
    const timeUsed = 150 - timeLeft;
    socket.emit('player-finished', {
      roomCode: room.code,
      finalScore,
      timeUsed,
      answers: answersToSend
    });
  };

  if (!gameActive) {
    return (
      <div className="flex flex-col items-center p-8 text-white">
        <h2 className="text-4xl font-bold mb-6">Game Finished!</h2>
        <div className="text-xl mb-4">Waiting for other players to finish...</div>
        <div className="mb-4">
          <p>Your Score: {playerAnswers.filter(a => a.wasCorrect).length}/26</p>
          <p>Time Used: {formatTime(150 - timeLeft)}</p>
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
      <div className="absolute top-28 left-4 bg-black/50 p-4 rounded-lg text-white z-10">
        <h3 className="font-bold mb-2">Live Scores</h3>
        {Object.entries(playerScores)
          .sort(([, a], [, b]) => b - a)
          .map(([username, score], index) => (
            <div key={username} className={`flex justify-between mb-1 ${username === user?.username ? 'text-yellow-400 font-bold' : ''}`}>
              <span>{index + 1}. {username}</span>
              <span>{score}</span>
            </div>
          ))}
      </div>

      <div className="game-container">
        <LetterCircles 
          customCurrentLetterIndex={currentQuestionIndex}
          customPlayerAnswers={playerAnswers}
          customAlphabet={alphabet}
          customSkippedLetters={skippedLetters}
          customSkipMode={skipMode}
        />

        <div className="center-content">
          <div className="stats">
            <div className="timer">Time: {formatTime(timeLeft)}</div>
            <div className="skips">Skips: {skipsRemaining} remaining</div>
          </div>

          <div className="question-container">
            <div className="question">{currentQuestion?.question || '...'}</div>
            <input
              type="text"
              id="answer-input"
              ref={answerRef}
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Type your answer here"
              disabled={!gameActive}
              onKeyDown={(e) => e.key === 'Enter' && submitAnswer()}
              className="text-white"
            />
          </div>

          <div className="button-container">
            <button id="skip-button" onClick={handleSkip} disabled={!gameActive || skipsRemaining <= 0}>
              Skip ({skipsRemaining} left)
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default MultiplayerGame;
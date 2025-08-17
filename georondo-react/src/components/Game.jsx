import React, { useEffect, useRef, useState } from 'react';
import { useGame } from '../GameContext';
import LetterCircles from './LetterCircles';

function Game({ onEndGame }) {
  const {
    alphabet,
    currentLetterIndex,
    skipsRemaining,
    totalTime,
    setTotalTime,
    gameActive,
    currentQuestion,
    playerAnswers,
    setNextQuestion,
    handleSubmit,
    handleSkip,
    endGame,
    skippedLetters,
    skipMode,
  } = useGame();

  const answerRef = useRef(null);
  const [currentAnswer, setCurrentAnswer] = useState('');

  const submitAnswer = () => {
    if (!gameActive) return;

    const answer = currentAnswer.trim();
    if (!answer) return;

    if (['SKIP', 'PASS'].includes(answer.toUpperCase())) {
      handleSkip();
    } else {
      handleSubmit(answer);
    }

    setCurrentAnswer('');
  };

  useEffect(() => {
    if (answerRef.current) {
      answerRef.current.focus();
    }
  }, [currentLetterIndex, currentQuestion]);

  useEffect(() => {
  // Game ends when gameActive becomes false
  if (!gameActive) {
    onEndGame(playerAnswers);
  }
}, [gameActive, playerAnswers, onEndGame]);

  return (
    <div id="game-ui">
      <div className="game-container">
        <div className="game-center-wrapper">
          <div className="center-content">
            <div className="stats">
              <div className="timer">
                Time: {Math.floor(totalTime / 60)}:{String(totalTime % 60).padStart(2, '0')}
              </div>
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
                className="text-white bg-black/30 px-3 py-2 rounded"
              />
            </div>

            <div className="button-container">
              <button
                id="skip-button"
                onClick={handleSkip}
                disabled={!gameActive || skipsRemaining <= 0}
              >
                Skip ({skipsRemaining} left)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Game;

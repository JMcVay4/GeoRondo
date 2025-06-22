import React, { useEffect, useRef } from 'react';
import { useGame } from '../GameContext';

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

  const submitAnswer = () => {
    if (!gameActive) return;

    const answer = answerRef.current.value.trim();
    if (!answer) return;

    if (answer.toUpperCase() === 'SKIP') {
      handleSkip();
    } else {
      handleSubmit(answer);
    }

    answerRef.current.value = '';
  };

  useEffect(() => {
    if (answerRef.current) {
      answerRef.current.focus();
    }
  }, [currentLetterIndex, currentQuestion]);

  useEffect(() => {
    const gameOver =
      !gameActive &&
      (currentLetterIndex >= alphabet.length ||
        (skipMode && skippedLetters.length === 0));

    if (gameOver) {
      onEndGame(playerAnswers);
    }
  }, [gameActive, currentLetterIndex, skippedLetters, skipMode, playerAnswers]);

  return (
    <div id="game-ui">
      <div className="game-container">
        <div className="center-content">
          <div className="stats">
            <div className="timer">
              Time: {Math.floor(totalTime / 60)}:
              {String(totalTime % 60).padStart(2, '0')}
            </div>
            <div className="skips">Skips: {skipsRemaining} remaining</div>
          </div>

          <div className="question-container">
            <div className="question">{currentQuestion?.question || '...'}</div>
            <input
              type="text"
              id="answer-input"
              ref={answerRef}
              placeholder="Type your answer here"
              disabled={!gameActive}
              onKeyDown={(e) => e.key === 'Enter' && submitAnswer()}
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
  );
}
export default Game;

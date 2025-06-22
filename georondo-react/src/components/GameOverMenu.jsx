import React from 'react';
import { useGame } from '../GameContext';

export default function GameOverMenu({ onPlayAgain }) {
  const { gameOverData, selectedDifficulty, setSelectedDifficulty } = useGame();
  const { totalTimeUsed = 0 } = gameOverData || {};

  return (
    <>
      <h1 className="title">GeoRondo</h1>
      {totalTimeUsed > 0 && <div className="final-time">Your time: {totalTimeUsed.toFixed(1)} seconds</div>}
      <p className="subtitle">Choose your difficulty and begin your round:</p>
      <div className="toggle-difficulty">
        <input type="radio" id="summary-easy" name="difficulty-summary" value="easy" checked={selectedDifficulty === 'easy'} onChange={() => setSelectedDifficulty('easy')} />
        <label htmlFor="summary-easy">Easy</label>

        <input type="radio" id="summary-medium" name="difficulty-summary" value="medium" checked={selectedDifficulty === 'medium'} onChange={() => setSelectedDifficulty('medium')} />
        <label htmlFor="summary-medium">Medium</label>

        <input type="radio" id="summary-hard" name="difficulty-summary" value="hard" checked={selectedDifficulty === 'hard'} onChange={() => setSelectedDifficulty('hard')} />
        <label htmlFor="summary-hard">Hard</label>

        <input type="radio" id="summary-grandmaster" name="difficulty-summary" value="grandmaster" checked={selectedDifficulty === 'grandmaster'} onChange={() => setSelectedDifficulty('grandmaster')} />
        <label htmlFor="summary-grandmaster">Grandmaster</label>
      </div>
      <button
        id="play-again-button"
        className="big-play-button"
        onClick={onPlayAgain}
      >
        Play Again
      </button>
    </>
  );
} 
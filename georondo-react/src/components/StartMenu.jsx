import React from 'react';
import { useGame } from '../GameContext';

function StartMenu({ onStartGame, onStartDailyChallenge, onShowLeaderboard, onHowToPlay }) {
  const { selectedDifficulty, setSelectedDifficulty, gameActive } = useGame();
  return (
    <div id="start-screen" className="flex flex-col items-center text-white">
      <div className="dashboard-container grid grid-cols-[minmax(350px,_1fr)_1fr_minmax(350px,_1fr)] gap-10 p-[100px_60px_40px] max-w-[1400px] mx-auto w-full box-border min-h-screen items-start relative z-[1]">
        <div className="sidebar left flex flex-col gap-5 items-start">
          <div className="card bg-white/10 border border-white/20 rounded-2xl p-5 text-center shadow-[0_0_15px_rgba(0,0,0,0.6)] backdrop-blur text-white mt-5">
            <h2 className="text-2xl font-bold mb-1">🌍 Daily Challenge</h2>
            <p className="mb-4">Same challenge for everyone!</p>
            <button
              id="daily-button"
              onClick={onStartDailyChallenge}
              className="mt-2 px-5 py-2.5 rounded-lg bg-blue-500 text-white font-bold"
            >
              Play
            </button>
          </div>
        </div>
        <div id="main-menu-container" className="main-menu text-center">
          <h1 className="title text-[3rem] mb-2 text-white font-bold">GeoRondo</h1>
          <div id="final-time-display" className="final-time text-white text-xl my-2" />
          <p className="subtitle text-white text-lg mb-6">
            Choose your difficulty and begin your round:
          </p>
          <div className="toggle-difficulty">
            {['easy', 'medium', 'hard', 'grandmaster'].map((level) => (
              <React.Fragment key={level}>
                <input
                  type="radio"
                  id={level}
                  name="difficulty"
                  value={level}
                  checked={selectedDifficulty === level}
                  onChange={() => setSelectedDifficulty(level)}
                  className="hidden"
                  disabled={gameActive}
                />
                <label
                  htmlFor={level}
                  className={`cursor-pointer px-4 py-2 rounded-md font-bold transition-all ${
                    selectedDifficulty === level
                      ? 'bg-blue-500 scale-105 text-white'
                      : 'bg-[#333] text-white'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </label>
              </React.Fragment>
            ))}
          </div>
          <button
            id="start-button"
            onClick={onStartGame}
            className="big-play-button px-7 py-3 text-lg rounded-lg bg-blue-500 text-white font-bold shadow-[0_0_10px_#3399ff] hover:scale-105 transition mb-4"
          >
            Start Game
          </button>
        </div>
        <div className="sidebar right flex flex-col gap-5 items-end">
          <div className="card bg-white/10 border border-white/20 rounded-2xl p-5 text-center shadow-[0_0_15px_rgba(0,0,0,0.6)] backdrop-blur text-white mt-5">
            <h2 className="text-2xl font-bold mb-1">Leaderboard</h2>
            <p className="mb-4">See today's top GeoRondo players</p>
            <button
              id="show-leaderboard"
              onClick={onShowLeaderboard}
              className="mt-2 px-5 py-2.5 rounded-lg bg-blue-500 text-white font-bold"
            >
              View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StartMenu;

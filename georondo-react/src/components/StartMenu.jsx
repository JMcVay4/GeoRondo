import React from 'react';
import { useGame } from '../GameContext';

function StartMenu() {
  const {
    startGame,
    difficulty,
    setDifficulty,
    setView,
    user,
    setMultiplayerMode,
    multiplayerMode,
    setMultiplayerRoomCode,
  } = useGame();

  const handleCreateClick = () => {
    if (!user) {
      setView('login');
    } else {
      setMultiplayerMode('create');
    }
  };

  const handleJoinClick = () => {
    if (!user) {
      setView('login');
    } else {
      setMultiplayerMode('join');
    }
  };

  const handleBackToMain = () => {
    setMultiplayerMode(null);
    setMultiplayerRoomCode('');
  };

  return (
    <div id="start-screen">
      <div className="dashboard-container">
        {/* LEFT SIDEBAR */}
        <div className="sidebar left">
          <div className="card">
            <div role="img" aria-label="globe">🌍</div>
            <div>Daily Challenge</div>
            <p>Same challenge for everyone!</p>
            <button onClick={() => setView('daily')}>Play</button>
          </div>

          <div className="card">
            <div role="img" aria-label="multiplayer">👥</div>
            <div>Multiplayer</div>
            <p>Challenge your friends!</p>

            {multiplayerMode === null && (
              <>
                <button onClick={handleCreateClick}>Create Room</button>
                <button onClick={handleJoinClick}>Join Room</button>
              </>
            )}

            {multiplayerMode === 'create' && (
              <>
                <p>Creating a new room...</p>
                <button onClick={handleBackToMain}>Back</button>
              </>
            )}

            {multiplayerMode === 'join' && (
              <>
                <p>Joining a friend’s room...</p>
                <button onClick={handleBackToMain}>Back</button>
              </>
            )}
          </div>
        </div>

        {/* CENTER MENU */}
        <div className="main-menu">
          <h1 className="title">GeoRondo</h1>
          <p className="subtitle">Choose your difficulty and begin your round:</p>

          <div className="toggle-difficulty">
            <input
              type="radio"
              id="easy"
              value="easy"
              checked={difficulty === 'easy'}
              onChange={() => setDifficulty('easy')}
            />
            <label htmlFor="easy">Easy</label>

            <input
              type="radio"
              id="medium"
              value="medium"
              checked={difficulty === 'medium'}
              onChange={() => setDifficulty('medium')}
            />
            <label htmlFor="medium">Medium</label>

            <input
              type="radio"
              id="hard"
              value="hard"
              checked={difficulty === 'hard'}
              onChange={() => setDifficulty('hard')}
            />
            <label htmlFor="hard">Hard</label>

            <input
              type="radio"
              id="grandmaster"
              value="grandmaster"
              checked={difficulty === 'grandmaster'}
              onChange={() => setDifficulty('grandmaster')}
            />
            <label htmlFor="grandmaster">Grandmaster</label>
          </div>

          <button className="big-play-button" onClick={startGame}>
            Start Game
          </button>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="sidebar right">
          <div className="card">
            <div>Leaderboard</div>
            <p>See today's top GeoRondo players</p>
            <button onClick={() => setView('leaderboard')}>View</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StartMenu;

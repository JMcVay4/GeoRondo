import React, { useState, useContext, useEffect } from 'react';
import { io } from 'socket.io-client';
import { GameContext } from './GameContext';
import NavBar from "./components/NavBar";
import Game from "./components/Game";
import Summary from "./components/Summary";
import Leaderboard from "./components/Leaderboard";
import LoginModal from "./components/LoginModal";
import HowToPlay from "./components/HowToPlay";
import LetterCircles from "./components/LetterCircles";
import GameOverMenu from './components/GameOverMenu';
import MultiplayerLobby from './components/MultiplayerLobby';
import MultiplayerGame from './components/MultiplayerGame';
import MultiplayerResults from './components/MultiplayerResults';
import "./assets/styles.css";

function App() {
  const [currentView, setCurrentView] = useState('start');
  const [previousView, setPreviousView] = useState('start');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [socket, setSocket] = useState(null);
  const [multiplayerRoom, setMultiplayerRoom] = useState(null);
  const [multiplayerResults, setMultiplayerResults] = useState(null);
  const [multiplayerMode, setMultiplayerMode] = useState(null);

  const {
    startGame,
    startDailyChallenge,
    selectedDifficulty,
    setSelectedDifficulty,
    user,
    logout
  } = useContext(GameContext);

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  const handleNavigate = (view) => {
    if (['leaderboard', 'howto'].includes(view)) setPreviousView(currentView);
    setCurrentView(view);
  };

  const handleBack = () => setCurrentView(previousView);

  const handleStartGame = () => {
    if (startGame) startGame(selectedDifficulty);
    setCurrentView('game');
  };

  const handleDailyChallengeStart = () => {
    if (startDailyChallenge) startDailyChallenge();
    setCurrentView('game');
  };

  const handlePlayAgain = () => {
    if (startGame) startGame(selectedDifficulty);
    setCurrentView('game');
  };

  const handleStartMultiplayerGame = (room) => {
    setMultiplayerRoom(room);
    setCurrentView('multiplayer-game');
  };

  const handleMultiplayerGameEnd = (results) => {
    setMultiplayerResults(results);
    setCurrentView('multiplayer-results');
  };

  const handleBackToMultiplayerLobby = () => {
    setMultiplayerResults(null);
    // Do NOT clear multiplayerRoom here
    setCurrentView('multiplayer-lobby');
  };

  const handleBackToMainMenu = () => {
    setMultiplayerRoom(null);
    setMultiplayerResults(null);
    setCurrentView('start');
  };

  const handleCreateRoom = () => {
    if (socket && user?.username) {
      setMultiplayerMode('create');
      setCurrentView('multiplayer-lobby');
      socket.emit('create-room', {
        username: user.username,
        difficulty: selectedDifficulty
      });
    } else {
      setShowLoginModal(true);
    }
  };

  const handleJoinRoom = () => {
    setMultiplayerMode('join');
    setCurrentView('multiplayer-lobby');
  };

  const showCircle = !['howto', 'leaderboard', 'multiplayer-results', 'multiplayer-lobby'].includes(currentView);
  const showSideCards = ['start', 'summary'].includes(currentView);

  return (
    <>
      <video src="/starbackground.mp4" muted loop autoPlay playsInline id="background-video" />
      <div id="blue-tint" />
      {showCircle && currentView !== 'multiplayer-game' && <LetterCircles />}


      <NavBar
        onShowLogin={() => setShowLoginModal(true)}
        user={user}
        onLogout={logout}
        onNavigate={handleNavigate}
      />

      <div className="max-w-7xl mx-auto px-4">
        {showSideCards && (
          <div className="dashboard-container">
            <div className="sidebar left">
              <div className="card">
                <h2>🌍 Daily Challenge</h2>
                <p>Same challenge for everyone!</p>
                <button id="daily-button" onClick={handleDailyChallengeStart} className="big-play-button">Play</button>
              </div>

              <div className="card">
                <h2>👥 Multiplayer</h2>
                <p>Challenge your friends!</p>
                {user?.username ? (
                  <div className="button-row">
                    <button onClick={handleCreateRoom} className="big-play-button">Create Room</button>
                    <button onClick={handleJoinRoom} className="big-play-button">Join Room</button>
                  </div>
                ) : (
                  <button id="multiplayer-button" className="big-play-button" onClick={() => setShowLoginModal(true)}>
                    Login Required
                  </button>
                )}
              </div>
            </div>

            <div className="main-menu">
              {currentView === 'start' && (
                <>
                  <h1 className="title">GeoRondo</h1>
                  <p className="subtitle">Choose your difficulty and begin your round:</p>
                  <div className="toggle-difficulty">
                    {['easy', 'medium', 'hard', 'grandmaster'].map(level => (
                      <React.Fragment key={level}>
                        <input
                          type="radio"
                          id={level}
                          name="difficulty"
                          value={level}
                          checked={selectedDifficulty === level}
                          onChange={() => setSelectedDifficulty(level)}
                        />
                        <label htmlFor={level}>{level[0].toUpperCase() + level.slice(1)}</label>
                      </React.Fragment>
                    ))}
                  </div>
                  <button id="start-button" className="big-play-button" onClick={handleStartGame}>
                    Start Game
                  </button>
                </>
              )}
              {currentView === 'summary' && <GameOverMenu onPlayAgain={handlePlayAgain} />}
            </div>

            <div className="sidebar right">
              <div className="card">
                <h2>Leaderboard</h2>
                <p>See today's top GeoRondo players</p>
                <button id="show-leaderboard" className="big-play-button" onClick={() => handleNavigate('leaderboard')}>
                  View
                </button>
              </div>
            </div>
          </div>
        )}

        {currentView === 'game' && (
          <Game onEndGame={() => setCurrentView('summary')} />
        )}
        {currentView === 'multiplayer-game' && (
          <MultiplayerGame
            socket={socket}
            room={multiplayerRoom}
            onGameEnd={handleMultiplayerGameEnd}
          />
        )}
        {currentView === 'summary' && (
          <Summary user={user} onShowLogin={() => setShowLoginModal(true)} />
        )}
        {currentView === 'multiplayer-lobby' && (
          <MultiplayerLobby
            socket={socket}
            onBack={() => setCurrentView('start')}
            onStartMultiplayerGame={handleStartMultiplayerGame}
            mode={multiplayerMode}
            room={multiplayerRoom}
          />
        )}

        {currentView === 'multiplayer-results' && (
          <MultiplayerResults
            results={multiplayerResults}
            onBackToLobby={handleBackToMultiplayerLobby}
            onBackToMenu={handleBackToMainMenu}
            socket={socket}
            roomCode={multiplayerRoom?.code}
          />
        )}
        {currentView === 'leaderboard' && <Leaderboard onBack={handleBack} />}
        {currentView === 'howto' && <HowToPlay onBack={handleBack} />}
      </div>

      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
    </>
  );
}

export default App;

// georondo-react/src/App.jsx
import React, { useState, useContext, useEffect } from 'react';
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

import config from './config/environment.js';
import "./assets/styles.css";

function formatHMS(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function msUntilNextUtcMidnight() {
  const now = new Date();
  const nextUtcMidnight = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));
  return nextUtcMidnight - now;
}

function App() {
  const [currentView, setCurrentView] = useState('start');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [multiplayerRoom, setMultiplayerRoom] = useState(null);
  const [multiplayerResults, setMultiplayerResults] = useState(null);
  const [multiplayerMode, setMultiplayerMode] = useState(null);

  const [viewStack, setViewStack] = useState(['start']);
  const pushView = (view) => { setViewStack((prev) => [...prev, view]); setCurrentView(view); };
  const popView = () => {
    setViewStack((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.slice(0, -1);
      setCurrentView(next[next.length - 1]);
      return next;
    });
  };
  const resetToHome = () => { setViewStack(['start']); setCurrentView('start'); };

  const [dailyRemainingMs, setDailyRemainingMs] = useState(msUntilNextUtcMidnight());
  useEffect(() => { const id = setInterval(() => setDailyRemainingMs(msUntilNextUtcMidnight()), 1000); return () => clearInterval(id); }, []);

  const {
    startGame,
    startDailyChallenge,
    selectedDifficulty,
    setSelectedDifficulty,
    user,
    logout: contextLogout,
    socket,
  } = useContext(GameContext);

  const [hasPlayedDaily, setHasPlayedDaily] = useState(localStorage.getItem('gr_dailyPlayed_' + new Date().toISOString().slice(0,10)) === '1');
  useEffect(() => { setHasPlayedDaily(localStorage.getItem('gr_dailyPlayed_' + new Date().toISOString().slice(0,10)) === '1'); }, [dailyRemainingMs]);

  useEffect(() => {
    const checkDaily = async () => {
      try {
        if (user?.id) {
          const res = await fetch(`${config.API_URL}/daily-status?userId=${user.id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.playedToday) {
              localStorage.setItem('gr_dailyPlayed_' + new Date().toISOString().slice(0,10), '1');
              setHasPlayedDaily(true);
              return;
            }
          }
        }
        setHasPlayedDaily(localStorage.getItem('gr_dailyPlayed_' + new Date().toISOString().slice(0,10)) === '1');
      } catch {
        setHasPlayedDaily(localStorage.getItem('gr_dailyPlayed_' + new Date().toISOString().slice(0,10)) === '1');
      }
    };
    checkDaily();
  }, [user, dailyRemainingMs]);

  const handleNavigate = (view) => pushView(view);
  const handleBack = () => popView();

  const logout = () => { contextLogout?.(); resetToHome(); };

  const handleStartGame = () => { if (startGame) startGame(selectedDifficulty); pushView('game'); };
  const handleDailyChallengeStart = () => {
    if (hasPlayedDaily) return;
    if (startDailyChallenge) startDailyChallenge();
    localStorage.setItem('gr_dailyPlayed_' + new Date().toISOString().slice(0,10), '1');
    setHasPlayedDaily(true);
    pushView('game');
  };
  const handlePlayAgain = () => { if (startGame) startGame(selectedDifficulty); pushView('game'); };

  const handleStartMultiplayerGame = (room) => { setMultiplayerRoom(room); pushView('multiplayer-game'); };
  const handleMultiplayerGameEnd = (results) => { setMultiplayerResults(results); pushView('multiplayer-results'); };

  // ✅ RESULTS → LOBBY (Play Again): go back to the SAME lobby (code + difficulty)
  const handleBackToMultiplayerLobby = () => {
    setMultiplayerResults(null);
    if (multiplayerRoom) {
      // Replace stack with Start → Lobby to ensure clean nav and correct screen
      setViewStack(['start', 'multiplayer-lobby']);
      setCurrentView('multiplayer-lobby');
    } else {
      // Fallback (shouldn't normally happen): just push lobby
      pushView('multiplayer-lobby');
    }
  };

  // ✅ RESULTS → START (Leave Game): leave room & go home
  const handleBackToMainMenu = () => {
    // Let lobby handle actual socket leave when user hits "Leave Room" there,
    // but to guarantee leaving immediately you could also emit here if desired.
    setMultiplayerRoom(null);
    setMultiplayerResults(null);
    resetToHome();
  };

  const handleCreateRoom = () => {
    if (socket && user?.username) {
      setMultiplayerMode('create');
      pushView('multiplayer-lobby');
      socket.emit('create-room', {
        username: user.username,
        difficulty: selectedDifficulty
      });
    } else {
      setShowLoginModal(true);
    }
  };
  const handleJoinRoom = () => { setMultiplayerMode('join'); pushView('multiplayer-lobby'); };

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
                <h2 className="text-xl font-bold mb-2">🌍 Daily Challenge</h2>
                <button
                  id="daily-button"
                  className="big-play-button w-full mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleDailyChallengeStart}
                  disabled={hasPlayedDaily}
                >
                  {hasPlayedDaily ? 'Played – Come back tomorrow' : 'Play'}
                </button>
                <div className="mt-1 text-sm text-white/90">
                  <div className="font-semibold">
                    Next Daily Challenge in: {formatHMS(dailyRemainingMs)}
                  </div>
                </div>
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
          <Game onEndGame={() => pushView('summary')} />
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
            onBack={handleBack}
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

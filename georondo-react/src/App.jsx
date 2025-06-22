import React, { useState, useContext } from 'react';
import { GameContext } from './GameContext';
import NavBar from "./components/navbar";
import Game from "./components/game";
import Summary from "./components/Summary";
import Leaderboard from "./components/leaderboard";
import LoginModal from "./components/loginModal";
import HowToPlay from "./components/howToPlay";
import LetterCircles from "./components/LetterCircles";
import GameOverMenu from './components/GameOverMenu';
import "./assets/styles.css";

function App() {
  const [currentView, setCurrentView] = useState('start');
  const [previousView, setPreviousView] = useState('start');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const {
    startGame,
    startDailyChallenge,
    selectedDifficulty,
    setSelectedDifficulty,
    user,
    logout
  } = useContext(GameContext);
  const handleNavigate = (view) => {
    if (['leaderboard', 'howto'].includes(view)) {
      setPreviousView(currentView);
    }
    setCurrentView(view);
  };
  const handleBack = () => {
    setCurrentView(previousView);
  };
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
  const showCircle = !['howto', 'leaderboard'].includes(currentView);
  const showSideCards = ['start', 'summary'].includes(currentView);
  return (
    <>
      <video src="/starbackground.mp4" muted loop autoPlay playsInline id="background-video" />
      <div id="blue-tint" />
      {showCircle && <LetterCircles />}

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
                <button id="daily-button" onClick={handleDailyChallengeStart} className="big-play-button">
                  Play
                </button>
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
        {currentView === 'game' && <Game onEndGame={() => handleNavigate('summary')} />}
        {currentView === 'summary' && (
          <Summary user={user} onShowLogin={() => setShowLoginModal(true)} />
        )}
        {currentView === 'leaderboard' && <Leaderboard onBack={handleBack} />}
        {currentView === 'howto' && <HowToPlay onBack={handleBack} />}
      </div>

      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
    </>
  );
}
export default App;

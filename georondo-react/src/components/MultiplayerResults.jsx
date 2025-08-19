import React, { useState } from 'react';
import { useGame } from '../GameContext';

function MultiplayerResults({ results, onBackToLobby, onBackToMenu, socket, roomCode }) {
  const { user } = useGame();

  const safeResults = Array.isArray(results) ? results : [];
  const defaultPlayer = safeResults.length > 0
    ? (user?.username ?? safeResults[0]?.username)
    : null;

  const [selectedPlayer, setSelectedPlayer] = useState(defaultPlayer);

  const formatTime = (seconds = 0) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  const getRankEmoji = (rank) => (['🥇','🥈','🥉'][rank] ?? '🏅');

  // Play Again => go back to the SAME lobby; re-assert room state with the server
  const handlePlayAgain = () => {
    const code = (roomCode || '').toUpperCase();
    if (socket && code) {
      socket.emit('reset-room', { roomCode: code }); // safe no-op if unsupported by server
      socket.emit('join-room', { roomCode: code, username: user?.username });
      socket.emit('get-room',  { roomCode: code }); // safe no-op if unsupported
    }
    onBackToLobby();
  };

  // Leave Game => leave room then main menu
  const handleLeaveGame = () => {
    const code = (roomCode || '').toUpperCase();
    if (socket && code) {
      socket.emit('leave-room', { roomCode: code });
    }
    onBackToMenu();
  };

  if (safeResults.length === 0) {
    return (
      <div className="flex flex-col items-center p-8 text-white">
        <h2 className="text-3xl font-bold mb-6">Game Results</h2>
        <div className="mb-6">No results available yet.</div>
        <div className="space-y-4">
          <button onClick={handlePlayAgain} className="big-play-button bg-green-500 hover:bg-green-600">
            Play Again (Back to Lobby)
          </button>
          <button onClick={handleLeaveGame} className="big-play-button bg-red-500 hover:bg-red-600">
            Leave Game (Main Menu)
          </button>
        </div>
      </div>
    );
  }

  const winner = safeResults[0];
  const selectedPlayerData = safeResults.find(r => r.username === selectedPlayer) || safeResults[0];

  return (
    <div className="flex flex-col items-center p-8 text-white">
      <h2 className="text-4xl font-bold mb-6">Game Results</h2>

      <div className="mb-8 text-center">
        <div className="text-6xl mb-2">🎉</div>
        <div className="text-2xl font-bold mb-2">{winner?.username} Wins!</div>
        <div className="text-lg text-gray-300">
          Score: {winner?.score}/26 • Time: {formatTime(winner?.timeUsed)}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-bold mb-4 text-center">Select Player Summary</h3>
        <div className="flex gap-2 flex-wrap justify-center">
          {safeResults.map((r, i) => (
            <button
              key={r.username}
              onClick={() => setSelectedPlayer(r.username)}
              className={`px-4 py-2 rounded-lg font-bold transition ${
                selectedPlayer === r.username ? 'bg-blue-500 text-white' : 'bg-gray-600 text-white hover:bg-gray-500'
              }`}
            >
              {getRankEmoji(i)} {r.username}
            </button>
          ))}
        </div>
      </div>

      {/* Exactly two actions */}
      <div className="space-y-4 mb-8">
        <button onClick={handlePlayAgain} className="big-play-button bg-green-500 hover:bg-green-600">
          Play Again (Back to Lobby)
        </button>
        <button onClick={handleLeaveGame} className="big-play-button bg-red-500 hover:bg-red-600">
          Leave Game (Main Menu)
        </button>
      </div>

      {/* Summary */}
      <div className="difficulty-board w-full max-w-4xl mx-auto mb-8">
        <h3 className="text-2xl font-bold mb-4 text-center">
          {selectedPlayerData.username}&apos;s Game Summary
        </h3>
        <div className="bg-white/10 rounded-lg p-4 mb-4">
          <div className="text-center text-lg">
            <strong>Score:</strong> {selectedPlayerData.score}/26 •{' '}
            <strong>Time:</strong> {formatTime(selectedPlayerData.timeUsed)} •{' '}
            <strong>Rank:</strong> {safeResults.findIndex(r => r.username === selectedPlayerData.username) + 1} of {safeResults.length}
          </div>
        </div>
        <table className="w-full text-left text-white">
          <thead>
            <tr className="bg-white/10">
              <th className="p-2">Letter</th>
              <th className="p-2">Question</th>
              <th className="p-2">Answer</th>
              <th className="p-2">Status</th>
              <th className="p-2">Correct Answer</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(selectedPlayerData.playerAnswers) && selectedPlayerData.playerAnswers.length > 0 ? (
              selectedPlayerData.playerAnswers.map((a, i) => (
                <tr key={i} className="border-b border-white/10 text-white">
                  <td className="p-2">{a.letter}</td>
                  <td className="p-2">{a.question}</td>
                  <td className="p-2">{a.userAnswer || 'Skipped'}</td>
                  <td className="p-2">{a.wasCorrect ? 'Correct' : a.userAnswer === '' ? 'Skipped' : 'Incorrect'}</td>
                  <td className="p-2">{a.correctAnswers.join(', ')}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="p-4 text-center text-white">No answers recorded for this player.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MultiplayerResults;

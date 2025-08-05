import React, { useState } from 'react';
import { useGame } from '../GameContext';

function MultiplayerResults({ results, onBackToLobby, onBackToMenu, socket, roomCode }) {
  const { user } = useGame();
  const [selectedPlayer, setSelectedPlayer] = useState(user?.username || results[0]?.username);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRankEmoji = (rank) => {
    switch (rank) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return '🏅';
    }
  };

  const handlePlayAgain = () => {
    // Reset room state for a new game
    if (socket && roomCode) {
      socket.emit('reset-room', { roomCode });
    }
    onBackToLobby();
  };

  const userResult = results.find(r => r.username === user?.username);
  const userRank = results.findIndex(r => r.username === user?.username);
  const selectedPlayerData = results.find(r => r.username === selectedPlayer);

  return (
    <div className="flex flex-col items-center p-8 text-white">
      <h2 className="text-4xl font-bold mb-6">Game Results</h2>
      
      {/* Winner Announcement */}
      <div className="mb-8 text-center">
        <div className="text-6xl mb-2">🎉</div>
        <div className="text-2xl font-bold mb-2">
          {results[0]?.username} Wins!
        </div>
        <div className="text-lg text-gray-300">
          Score: {results[0]?.score}/26 • Time: {formatTime(results[0]?.timeUsed)}
        </div>
      </div>

      {/* Player Selection */}
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-4 text-center">Select Player Summary</h3>
        <div className="flex gap-2 flex-wrap justify-center">
          {results.map((result, index) => (
            <button
              key={result.username}
              onClick={() => setSelectedPlayer(result.username)}
              className={`px-4 py-2 rounded-lg font-bold transition ${
                selectedPlayer === result.username
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-600 text-white hover:bg-gray-500'
              }`}
            >
              {getRankEmoji(index)} {result.username}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons - moved above summary table */}
      <div className="space-y-4 mb-8">
        <button
          onClick={handlePlayAgain} // Play Again should go to lobby
          className="big-play-button bg-green-500 hover:bg-green-600"
        >
          Play Again
        </button>
        <button
          onClick={onBackToMenu}
          className="big-play-button"
        >
          Back to Main Menu
        </button>
      </div>

      {/* Player Summary Table */}
      {selectedPlayerData && (
        <div className="difficulty-board w-full max-w-4xl mx-auto mb-8">
          <h3 className="text-2xl font-bold mb-4 text-center">
            {selectedPlayer}'s Game Summary
          </h3>
          <div className="bg-white/10 rounded-lg p-4 mb-4">
            <div className="text-center">
              <div className="text-lg">
                <strong>Score:</strong> {selectedPlayerData.score}/26 • 
                <strong> Time:</strong> {formatTime(selectedPlayerData.timeUsed)} • 
                <strong> Rank:</strong> {results.findIndex(r => r.username === selectedPlayer) + 1} of {results.length}
              </div>
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
              {selectedPlayerData.playerAnswers && selectedPlayerData.playerAnswers.length > 0 ? (
                selectedPlayerData.playerAnswers.map((answer, index) => (
                  <tr key={index} className="border-b border-white/10 text-white">
                    <td className="p-2">{answer.letter}</td>
                    <td className="p-2">{answer.question}</td>
                    <td className="p-2">{answer.userAnswer || 'Skipped'}</td>
                    <td className="p-2">
                      {answer.wasCorrect
                        ? 'Correct'
                        : answer.userAnswer === ''
                        ? 'Skipped'
                        : 'Incorrect'}
                    </td>
                    <td className="p-2">{answer.correctAnswers.join(', ')}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-white">
                    No answers recorded for this player.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default MultiplayerResults;
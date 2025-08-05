import React from 'react';
import { useGame } from '../GameContext';

const Summary = ({ user, onShowLogin }) => {
  const { playerAnswers } = useGame();

  return (
    <div
      className="summary-content flex flex-col items-center z-0"
      style={{ marginTop: '10rem' }}
    >
      <div id="login-prompt-container" className="text-center my-6 min-h-[110px]">
        {!user && (
          <>
            <p className="text-2xl font-semibold !text-white" style={{ color: 'white' }}>
              Want to appear on the leaderboard?
            </p>
            <button
              id="login-from-summary"
              className="big-play-button px-6 py-3 text-lg rounded-lg bg-blue-500 text-white font-bold hover:scale-105 transition"
              onClick={onShowLogin}
            >
              Log in / Create Account
            </button>
          </>
        )}
      </div>

      <div id="summary-container" className="difficulty-board w-full max-w-4xl mx-auto">
        <h2 className="!text-white text-center w-full text-2xl mb-4">Game Summary</h2>
        <table className="w-full text-left text-white">
          <thead>
            <tr className="bg-white/10">
              <th className="p-2">Letter</th>
              <th className="p-2">Question</th>
              <th className="p-2">Your Answer</th>
              <th className="p-2">Status</th>
              <th className="p-2">Correct Answer</th>
            </tr>
          </thead>
          <tbody>
            {playerAnswers && playerAnswers.length > 0 ? (
              playerAnswers.map((answer, index) => (
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
                  No answers recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Summary;

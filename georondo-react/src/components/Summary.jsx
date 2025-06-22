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

      <div id="summary-container" className="w-full max-w-4xl mx-auto">
        <h2 className="!text-white text-center w-full text-2xl mb-4">Game Summary</h2>
        <table className="w-full border-collapse shadow-lg rounded-md overflow-hidden bg-white">
          <thead>
            <tr className="bg-[#0b1635] text-white">
              <th className="p-3 text-left">Letter</th>
              <th className="p-3 text-left">Question</th>
              <th className="p-3 text-left">Your Answer</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Correct Answer</th>
            </tr>
          </thead>
          <tbody>
            {playerAnswers.map((answer, index) => (
              <tr key={index} className="bg-gray-100 text-black">
                <td className="p-3">{answer.letter}</td>
                <td className="p-3">{answer.question}</td>
                <td className="p-3">{answer.userAnswer || 'Skipped'}</td>
                <td className="p-3">
                  {answer.wasCorrect
                    ? 'Correct'
                    : answer.userAnswer === ''
                    ? 'Skipped'
                    : 'Incorrect'}
                </td>
                <td className="p-3">{answer.correctAnswers.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Summary;

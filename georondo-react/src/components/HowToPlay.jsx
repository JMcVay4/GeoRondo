import React from 'react';

function HowToPlay({ onBack }) {
  return (
    <div id="how-to-play-section" className="flex flex-col items-center p-8 text-white">
      <h2 className="howto-heading text-4xl font-bold mb-6">How to Play</h2>
      <button
        id="back-from-howtoplay"
        className="big-play-button mb-8"
        onClick={onBack}
      >
        Back
      </button>
      <div className="howto-container max-w-3xl text-lg text-left leading-relaxed bg-white/10 p-6 rounded-lg">
        <p className="mb-4">
          In this browser game, the player will be given a geography question
          for each letter of the alphabet A-Z. The answer must start with the highlighted letter.
        </p>
        <p className="mb-4">
          Type your answer and hit Enter. If correct, you score a point. You
          have 3 skips — click "Skip" or type "pass" to use them.
        </p>
        <p>
          You're on a timer, so answer quickly! At the end, your score is
          recorded on the leaderboard if their time is sufficient. Good luck!
        </p>
        <p>
          Login to have your name on the leaderboard!
        </p>
      </div>
    </div>
  );
}
export default HowToPlay;

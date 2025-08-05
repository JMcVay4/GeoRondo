import React, { useState, useEffect } from 'react';

const LeaderboardTable = ({ title, data }) => (
  <div className="difficulty-board">
    <h3 className="text-xl font-bold mb-4 !text-white">{title}</h3>
    <table className="w-full text-left text-white">
      <thead>
        <tr className="bg-white/10">
          <th className="p-2">Rank</th>
          <th className="p-2">Player</th>
          <th className="p-2">Score</th>
          <th className="p-2">Time</th>
        </tr>
      </thead>
      <tbody>
        {data.length > 0 ? (
          data.map((entry, index) => (
            <tr key={index} className="border-b border-white/10">
              <td className="p-2">{entry.rank}</td>
              <td className="p-2">{entry.username}</td>
              <td className="p-2">{entry.score}</td>
              <td className="p-2">{entry.time.toFixed(1)}s</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="4" className="p-4 text-center text-white">
              No scores yet for this difficulty!
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

export default function Leaderboard({ onBack }) {
  const [leaderboards, setLeaderboards] = useState({
    easy: [],
    medium: [],
    hard: [],
    grandmaster: [],
    daily: [],
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboards = async () => {
      console.log('Fetching leaderboards...');
      const difficulties = ['easy', 'medium', 'hard', 'grandmaster', 'daily'];
      const loadedLeaderboards = {};

      for (const diff of difficulties) {
        try {
          console.log(`Fetching ${diff} leaderboard...`);
          const res = await fetch(`http://localhost:3001/leaderboard?difficulty=${diff}`);
          console.log(`${diff} response status:`, res.status);
          
          if (res.ok) {
            const data = await res.json();
            console.log(`${diff} data:`, data);
            loadedLeaderboards[diff] = data;
          } else {
            console.error(`Failed to fetch ${diff}: ${res.status} ${res.statusText}`);
            const errorText = await res.text();
            console.error(`Error response for ${diff}:`, errorText);
            loadedLeaderboards[diff] = [];
          }
        } catch (err) {
          console.error(`Failed to fetch ${diff} leaderboard:`, err);
          loadedLeaderboards[diff] = [];
        }
      }
      
      console.log('Final leaderboards:', loadedLeaderboards);
      setLeaderboards(loadedLeaderboards);
      setLoading(false);
    };

    fetchLeaderboards();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center p-8">
        <h2 className="text-4xl font-bold mb-6 !text-white">Loading Leaderboards...</h2>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-8">
      <h2
        className="text-4xl font-bold mb-6 !text-white"
        style={{ color: 'white' }}
      >
        Leaderboards
      </h2>
      <button
        onClick={onBack}
        className="big-play-button mb-8"
      >
        Back
      </button>

      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8">
        <LeaderboardTable title="Easy" data={leaderboards.easy} />
        <LeaderboardTable title="Medium" data={leaderboards.medium} />
        <LeaderboardTable title="Hard" data={leaderboards.hard} />
        <LeaderboardTable title="Grandmaster" data={leaderboards.grandmaster} />
      </div>

      <div className="w-full max-w-3xl mt-8">
        <LeaderboardTable title="Today's Daily Challenge" data={leaderboards.daily} />
      </div>
    </div>
  );
}
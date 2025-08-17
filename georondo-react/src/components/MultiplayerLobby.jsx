import React, { useState, useEffect } from 'react';
import { useGame } from '../GameContext';

function MultiplayerLobby({ socket, onBack, onStartMultiplayerGame, mode, room: roomProp }) {
  const { user, selectedDifficulty, setSelectedDifficulty } = useGame();
  const [roomCode, setRoomCode] = useState(roomProp?.code || '');
  const [joinCode, setJoinCode] = useState('');
  const [room, setRoom] = useState(roomProp || null);
  const [error, setError] = useState('');
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    if (room?.difficulty && selectedDifficulty !== room.difficulty) {
      setSelectedDifficulty(room.difficulty);
    }
  }, [room?.difficulty, selectedDifficulty, setSelectedDifficulty]);

  useEffect(() => {
    if (room && user?.username) {
      setIsHost(room.host === user.username);
    }
  }, [room, user?.username]);

  useEffect(() => {
    if (!socket) return;

    socket.on('room-created', (data) => {
      setRoom(data.room);
      setRoomCode(data.roomCode);
      setIsHost(true);
      setError('');
    });

    socket.on('player-joined', (data) => setRoom(data.room));
    socket.on('room-updated', (data) => setRoom(data.room));
    socket.on('player-left', (data) => setRoom(data.room));
    socket.on('room-error', (data) => setError(data.message));
    socket.on('game-started', (data) => {
      onStartMultiplayerGame(data.room, data.currentQuestion, data.letter);
    });

    return () => {
      socket.off('room-created');
      socket.off('player-joined');
      socket.off('room-updated');
      socket.off('player-left');
      socket.off('room-error');
      socket.off('game-started');
    };
  }, [socket, onStartMultiplayerGame]);

  const joinRoom = () => {
    if (!user?.username) {
      setError('Please log in to join a room');
      return;
    }

    if (!joinCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    socket.emit('join-room', {
      roomCode: joinCode.toUpperCase(),
      username: user.username
    });

    setRoomCode(joinCode.toUpperCase());
    setError('');
  };

  const toggleReady = () => {
    socket.emit('toggle-ready', { roomCode });
  };

  const startGame = () => {
    if (!isHost) return;
    socket.emit('start-game', { roomCode });
  };

  const leaveRoom = () => {
    socket.emit('leave-room', { roomCode });
    setRoom(null);
    setRoomCode('');
    setJoinCode('');
    setIsHost(false);
    setError('');
    onBack();
  };

  const currentPlayer = room?.players.find(p => p.username === user?.username);
  const allReady = room?.players.every(p => p.ready) && room?.players.length >= 2;

  // If room doesn't exist yet
  if (!room) {
    return (
      <div className="flex flex-col items-center p-8 text-white">
        <h2 className="text-4xl font-bold mb-6">
          {mode === 'create' ? 'Creating Room...' : 'Join Room'}
        </h2>

        <button onClick={onBack} className="big-play-button mb-8">Back</button>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg">
            <p className="text-center">{error}</p>
          </div>
        )}

        {mode === 'join' && (
          <>
            <input
              type="text"
              placeholder="Enter Room Code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="px-4 py-3 text-lg text-center border rounded-lg text-black mb-6"
              maxLength={6}
            />
            <button onClick={joinRoom} className="big-play-button">
              Join Room
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-8 text-white">
      <h2 className="text-4xl font-bold mb-4">Room Lobby</h2>

      <div className="mb-6 text-center">
        <div className="text-2xl font-bold mb-2">Room Code: {roomCode}</div>
        <div className="text-sm text-gray-300">Share this code with your friends!</div>
        <div className="text-lg mt-2">Difficulty: {room.difficulty}</div>
      </div>

      {isHost && (
        <div className="mb-6">
          <p className="text-xl mb-2">Select Difficulty:</p>
          <div className="toggle-difficulty mb-4">
            {['easy', 'medium', 'hard', 'grandmaster'].map(level => (
              <React.Fragment key={level}>
                <input
                  type="radio"
                  id={`host-${level}`}
                  name="host-difficulty"
                  value={level}
                  checked={room.difficulty === level}
                  onChange={() => {
                    setSelectedDifficulty(level);
                    socket.emit('update-difficulty', { roomCode, difficulty: level });
                  }}
                  className="hidden"
                />
                <label
                  htmlFor={`host-${level}`}
                  className={`cursor-pointer px-4 py-2 rounded-md font-bold transition-all ${
                    room.difficulty === level
                      ? 'bg-blue-500 scale-105 text-white'
                      : 'bg-gray-600 text-white'
                  }`}
                >
                  {level[0].toUpperCase() + level.slice(1)}
                </label>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      <div className="mb-8 w-full max-w-2xl">
        <h3 className="text-2xl font-bold mb-4 text-center">Players ({room.players.length}/4)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {room.players.map((player, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 ${
                player.ready
                  ? 'bg-green-500/20 border-green-500'
                  : 'bg-gray-500/20 border-gray-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold">
                    {player.username}
                    {player.username === room.host && ' 👑'}
                  </div>
                  <div className="text-sm">
                    {player.ready ? '✅ Ready' : '⏳ Not Ready'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <button
          onClick={toggleReady}
          className={`big-play-button ${
            currentPlayer?.ready
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {currentPlayer?.ready ? 'Not Ready' : 'Ready Up!'}
        </button>

        {isHost && (
          <button
            onClick={startGame}
            disabled={!allReady}
            className="big-play-button disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {allReady ? 'Start Game!' : 'Waiting for all players to be ready...'}
          </button>
        )}

        <button onClick={leaveRoom} className="big-play-button bg-red-500 hover:bg-red-600">
          Leave Room
        </button>
      </div>

      {room.players.length < 2 && (
        <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500 rounded-lg">
          <p className="text-center">Need at least 2 players to start!</p>
        </div>
      )}
    </div>
  );
}

export default MultiplayerLobby;

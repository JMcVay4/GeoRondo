import React, { useState } from 'react';
import { useGame } from '../GameContext';

function LoginModal({ onClose }) {
  const { login, register } = useGame(); 
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const isLogin = mode === 'login';

  const handleSubmit = async () => {
    setError('');
    setSuccess(false);
    try {
      if (isLogin) {
        await login(username, password);
        onClose(); 
      } else {
        await register(username, password);
        setSuccess(true);
      }
    } catch (err) {
      setError(err.message || 'An error occurred.');
    }
  };
  const toggleMode = () => {
    setMode(isLogin ? 'register' : 'login');
    setError('');
    setSuccess(false);
  };
  return (
    <div id="auth-modal" className="flex">
      <div className="auth-card">
        <h2 id="auth-title">{isLogin ? 'Login' : 'Register'}</h2>
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        {success && (
          <p className="text-green-500 text-sm mb-2">
            Account created!{' '}
            <span className="auth-link" onClick={toggleMode}>
              Go to Login
            </span>
          </p>
        )}
        <input
          id="auth-username"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <input
          id="auth-password"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button id="auth-submit" onClick={handleSubmit}>
          {isLogin ? 'Login' : 'Create Account'}
        </button>
        <p id="auth-toggle-text" className="text-sm text-center mt-2">
          {isLogin
            ? "No account yet? "
            : 'Already have an account? '}
          <span
            id="toggle-auth-mode"
            className="auth-link"
            onClick={toggleMode}
          >
            {isLogin ? 'Create one' : 'Login'}
          </span>
        </p>
        <button id="auth-close" onClick={onClose}>✖</button>
      </div>
    </div>
  );
}
export default LoginModal;

import React, { useState } from 'react';

function NavBar({ user, onShowLogin, onLogout, onNavigate }) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    onLogout();
    setShowLogoutConfirm(false);
  };

  return (
    <header className="top-nav">
      <div className="logo">GeoRondo</div>
      <div className="nav-buttons flex items-center gap-4">
        <button onClick={() => onNavigate('howto')}>How to Play</button>
        {!user ? (
          <button id="login-button" onClick={onShowLogin}>Login</button>
        ) : (
          <div className="auth-status">
            {showLogoutConfirm ? (
              <div id="logout-confirmation" className="confirm-box">
                <span>Log out?</span>
                <button id="confirm-logout" onClick={handleLogout}>Yes</button>
                <button id="cancel-logout" onClick={() => setShowLogoutConfirm(false)}>No</button>
              </div>
            ) : (
              <>
                <span id="user-display">{user.username}</span>
                <button id="logout-button" className="auth-button" onClick={() => setShowLogoutConfirm(true)}>Logout</button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default NavBar;

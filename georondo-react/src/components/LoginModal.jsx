import React, { useEffect } from 'react';
import { useGame } from '../GameContext';

function LoginModal({ onClose }) {
  const { handleGoogleSignIn } = useGame();

  useEffect(() => {
    /* global google */
    if (window.google) {
      google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: (response) => {
          handleGoogleSignIn(response);
          onClose();
        },
      });

      google.accounts.id.renderButton(
        document.getElementById('google-signin-button'),
        {
          theme: 'outline',
          size: 'large',
        }
      );
    }
  }, [handleGoogleSignIn, onClose]);

  return (
    <div id="auth-modal" className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="auth-card bg-white/10 backdrop-blur-md p-8 rounded-lg border border-white/20 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-6 text-center text-white">Sign in to GeoRondo</h2>

        <div className="flex justify-center mb-6">
          <div id="google-signin-button"></div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default LoginModal;

import React, { useEffect, useRef, useState } from 'react';
import { useGame } from '../GameContext';
import config from '../config/environment';

function LoginModal({ onClose }) {
  const { handleGoogleSignIn } = useGame();
  const [googleStatus, setGoogleStatus] = useState('loading');
  const [authError, setAuthError] = useState('');
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const googleClientId = config.GOOGLE_CLIENT_ID;
    const buttonContainer = document.getElementById('google-signin-button');
    let cancelled = false;
    let fallbackTimer;

    const renderGoogleButton = () => {
      if (cancelled || !buttonContainer) return;

      if (!googleClientId) {
        setGoogleStatus('missing-client-id');
        return;
      }

      if (!window.google?.accounts?.id) {
        setGoogleStatus('unavailable');
        return;
      }

      buttonContainer.innerHTML = '';
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          setGoogleStatus('signing-in');
          setAuthError('');
          const result = await handleGoogleSignIn(response);
          if (result?.ok) {
            onCloseRef.current();
            return;
          }
          setGoogleStatus('ready');
          setAuthError(result?.error || 'Google sign-in did not complete.');
        },
      });

      window.google.accounts.id.renderButton(
        buttonContainer,
        {
          theme: 'outline',
          size: 'large',
          width: 260,
        }
      );
      setGoogleStatus('ready');
    };

    if (!googleClientId) {
      setGoogleStatus('missing-client-id');
      return undefined;
    }

    if (window.google?.accounts?.id) {
      renderGoogleButton();
      return undefined;
    }

    setGoogleStatus('loading');
    let script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const handleLoad = () => renderGoogleButton();
    const handleError = () => {
      if (!cancelled) setGoogleStatus('unavailable');
    };

    script.addEventListener('load', handleLoad);
    script.addEventListener('error', handleError);
    fallbackTimer = window.setTimeout(() => {
      if (!cancelled && !window.google?.accounts?.id) {
        setGoogleStatus('unavailable');
      }
    }, 6000);

    return () => {
      cancelled = true;
      window.clearTimeout(fallbackTimer);
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
    };
  }, [handleGoogleSignIn]);

  const statusMessage = {
    loading: 'Loading Google sign-in...',
    'signing-in': 'Signing in...',
    'missing-client-id': 'Google sign-in is missing VITE_GOOGLE_CLIENT_ID.',
    unavailable: 'Google sign-in could not load. Check your connection and authorized origin.',
  }[googleStatus];

  return (
    <div id="auth-modal" className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="auth-card bg-white/10 backdrop-blur-md p-8 rounded-lg border border-white/20 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-6 text-center text-white">Sign in to GeoRondo</h2>

        <div className="flex justify-center mb-6">
          <div id="google-signin-button"></div>
        </div>

        {googleStatus !== 'ready' && (
          <p className={`auth-status-message auth-status-message--${googleStatus}`}>
            {statusMessage}
          </p>
        )}

        {authError && (
          <p className="auth-status-message auth-status-message--unavailable">
            {authError}
          </p>
        )}

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

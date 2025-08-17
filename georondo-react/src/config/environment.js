const config = {
  development: {
    API_URL: 'http://localhost:3001',
    SOCKET_URL: 'http://localhost:3001',
    GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID
  },
  production: {
    API_URL: import.meta.env.VITE_API_URL || 'https://api.georondo.com',
    SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'https://api.georondo.com',
    GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID
  }
};

const environment = import.meta.env.MODE || 'development';
console.log('Current environment:', environment); // For debugging

export default config[environment];
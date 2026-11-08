import { io } from 'socket.io-client';

let socket = null;

// Dynamically compute the WebSocket server host
function getSocketServerUrl() {
  const customSocketUrl = import.meta.env.VITE_SOCKET_URL;
  if (customSocketUrl && customSocketUrl.trim()) {
    return customSocketUrl.trim().replace(/\/+$/, '');
  }

  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl && (apiUrl.startsWith('http://') || apiUrl.startsWith('https://'))) {
    // Strip trailing /api to connect directly to the WebSocket host (e.g. Render server)
    return apiUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
  }

  // Fallback to current browser origin (when running through reverse proxy or local dev)
  return window.location.origin;
}

export function getSocket() {
  if (!socket) {
    const token = localStorage.getItem('scrims_token');
    const serverUrl = getSocketServerUrl();

    socket = io(serverUrl, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling']
    });
  }
  return socket;
}

export function reconnectSocket() {
  if (socket) {
    socket.disconnect();
  }
  const token = localStorage.getItem('scrims_token');
  const serverUrl = getSocketServerUrl();

  socket = io(serverUrl, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    transports: ['websocket', 'polling']
  });
  return socket;
}

import axios, { type AxiosResponse } from 'axios';
import type { ApiResponse, User, GameState, GameHistory } from '../types';

// Determine the base URL based on environment
const getApiBaseUrl = () => {
  // For Docker build, use the environment variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Fallback for local development
  return 'http://localhost:3000/api';
};

const getWsUrl = () => {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  return 'ws://localhost:3000';
};

const API_BASE_URL = getApiBaseUrl();
const WS_BASE_URL = getWsUrl();

export { API_BASE_URL, WS_BASE_URL };

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: keep it to handle errors only. Do NOT change success return type here.
api.interceptors.response.use(
  (response) => response, // return full axios response so TS typings are consistent
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

// Helper to unwrap AxiosResponse to ApiResponse<T>
async function unwrap<T>(promise: Promise<AxiosResponse<ApiResponse<T>>>) {
  const res = await promise;
  return res.data as ApiResponse<T>; // explicit
}

// Auth API
export const authApi = {
  register: (username: string, email: string, password: string) =>
    unwrap<{ user: User; token: string }>(
      api.post<ApiResponse<{ user: User; token: string }>>('/auth/register', { username, email, password })
    ),

  login: (email: string, password: string) =>
    unwrap<{ user: User; token: string }>(
      api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', { email, password })
    ),

  logout: () => unwrap<void>(api.post<ApiResponse>('/auth/logout')),

  createAnonymous: (username: string) =>
    unwrap<{ user: User; token: string }>(
      api.post<ApiResponse<{ user: User; token: string }>>('/auth/anonymous', { username })
    ),

  getProfile: () => unwrap<User>(api.get<ApiResponse<User>>('/auth/profile')),
};

// Game API
export const gameApi = {
  createGame: (isPublic: boolean) =>
    unwrap<{ gameId: string; gameCode: string }>(
      api.post<ApiResponse<{ gameId: string; gameCode: string }>>('/games/create', { isPublic })
    ),

  joinGame: (gameCode: string) =>
    unwrap<GameState>(api.post<ApiResponse<GameState>>('/games/join', { gameCode })),

  findGame: () => unwrap<GameState>(api.get<ApiResponse<GameState>>('/games/find')),

  getGame: (gameId: string) => unwrap<GameState>(api.get<ApiResponse<GameState>>(`/games/${gameId}`)),

  makeMove: (gameId: string, position: number) =>
    unwrap<GameState>(api.post<ApiResponse<GameState>>(`/games/${gameId}/move`, { position })),

  getOpenGamesCount: () => unwrap<{ count: number }>(api.get<ApiResponse<{ count: number }>>('/games/open/count')),

  getActiveGames: () => unwrap<GameState[]>(api.get<ApiResponse<GameState[]>>('/games/active/list')),
};

// Profile API
export const profileApi = {
  getProfile: () => unwrap<User>(api.get<ApiResponse<User>>('/profile')),

  updateProfile: (data: { username?: string; email?: string }) =>
    unwrap<User>(api.put<ApiResponse<User>>('/profile', data)),

  updateAvatar: (formData: FormData) => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    return unwrap<{ avatarUrl: string }>(api.post<ApiResponse<{ avatarUrl: string }>>('/profile/avatar', formData, config));
  },

  getGameHistory: (page: number = 1, limit: number = 10) =>
    unwrap<GameHistory>(api.get<ApiResponse<GameHistory>>(`/profile/games/history?page=${page}&limit=${limit}`)),
};
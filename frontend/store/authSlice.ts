import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AuthUser, UserRole } from './apiSlice';

interface AuthState {
  token: string | null;
  role: UserRole | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
}

interface CredentialsPayload {
  token: string;
  role: UserRole;
  user: AuthUser;
}

const getInitialAuthState = (): AuthState => {
  if (typeof window === 'undefined') {
    return {
      token: null,
      role: null,
      user: null,
      isAuthenticated: false,
    };
  }

  const token = localStorage.getItem('token');
  const storedRole = localStorage.getItem('role');
  const role: UserRole | null = storedRole === 'buyer' || storedRole === 'seller' || storedRole === 'admin'
    ? storedRole
    : null;

  return {
    token,
    role,
    user: null,
    isAuthenticated: Boolean(token && role),
  };
};

const initialState: AuthState = getInitialAuthState();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<CredentialsPayload>) => {
      state.token = action.payload.token;
      state.role = action.payload.role;
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.token = null;
      state.role = null;
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
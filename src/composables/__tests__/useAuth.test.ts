import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuth } from '../useAuth';

// Mock Firebase Auth module
vi.mock('firebase/auth', () => {
  return {
    onAuthStateChanged: vi.fn((auth, callback) => {
      callback(null);
      return vi.fn();
    }),
    signInWithEmailAndPassword: vi.fn((auth, email, password) => {
      if (password === 'wrong') {
        return Promise.reject(new Error('Invalid password'));
      }
      return Promise.resolve({
        user: { uid: 'user-123', email, isAnonymous: false, displayName: 'Test User' },
      });
    }),
    createUserWithEmailAndPassword: vi.fn((auth, email, password) => {
      return Promise.resolve({
        user: { uid: 'new-user-456', email, isAnonymous: false },
      });
    }),
    updateProfile: vi.fn(() => Promise.resolve()),
    signInAnonymously: vi.fn(() => {
      return Promise.resolve({
        user: { uid: 'anon-789', isAnonymous: true, email: null },
      });
    }),
    signOut: vi.fn(() => Promise.resolve()),
  };
});

vi.mock('@/lib/firebase', () => ({
  auth: {},
}));

describe('useAuth Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides initial unauthenticated state', () => {
    const { user, isAuthenticated, isAnonymous } = useAuth();
    expect(user.value).toBeNull();
    expect(isAuthenticated.value).toBe(false);
    expect(isAnonymous.value).toBe(false);
  });

  it('logs in successfully with email and password', async () => {
    const { loginWithEmail, user, isAuthenticated } = useAuth();
    const result = await loginWithEmail('user@example.com', 'password123');

    expect(result.email).toBe('user@example.com');
    expect(user.value?.email).toBe('user@example.com');
    expect(isAuthenticated.value).toBe(true);
  });

  it('registers a new user with email, password, and display name', async () => {
    const { registerWithEmail, user } = useAuth();
    const result = await registerWithEmail('new@example.com', 'pass12345', 'New Account');

    expect(result.email).toBe('new@example.com');
    expect(user.value?.uid).toBe('new-user-456');
  });

  it('logs in anonymously as a guest', async () => {
    const { loginAnonymously, user, isAnonymous } = useAuth();
    const result = await loginAnonymously();

    expect(result.isAnonymous).toBe(true);
    expect(user.value?.isAnonymous).toBe(true);
    expect(isAnonymous.value).toBe(true);
  });

  it('signs out the user', async () => {
    const { loginAnonymously, logout, user, isAuthenticated } = useAuth();
    await loginAnonymously();
    expect(isAuthenticated.value).toBe(true);

    await logout();
    expect(user.value).toBeNull();
    expect(isAuthenticated.value).toBe(false);
  });
});

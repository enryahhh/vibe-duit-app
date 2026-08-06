import { ref, computed, onMounted, getCurrentInstance } from 'vue';
import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

const user = ref<User | null>(null);
const loading = ref<boolean>(true);
const error = ref<string | null>(null);
let unsubscribe: (() => void) | null = null;
let isInitialized = false;

/**
 * Composable for managing Firebase authentication state and actions.
 */
export function useAuth() {
  const isAuthenticated = computed(() => !!user.value);
  const isAnonymous = computed(() => user.value?.isAnonymous ?? false);

  const initAuth = (): Promise<User | null> => {
    return new Promise((resolve) => {
      if (isInitialized) {
        resolve(user.value);
        return;
      }

      loading.value = true;
      error.value = null;

      unsubscribe = onAuthStateChanged(
        auth,
        (currentUser) => {
          user.value = currentUser;
          loading.value = false;
          isInitialized = true;
          resolve(currentUser);
        },
        (err) => {
          error.value = err.message;
          loading.value = false;
          isInitialized = true;
          resolve(null);
        }
      );
    });
  };

  const loginWithEmail = async (email: string, pass: string) => {
    loading.value = true;
    error.value = null;
    try {
      const res = await signInWithEmailAndPassword(auth, email, pass);
      user.value = res.user;
      return res.user;
    } catch (err: any) {
      error.value = err.message || 'Failed to sign in with email';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const registerWithEmail = async (email: string, pass: string, displayName?: string) => {
    loading.value = true;
    error.value = null;
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      if (displayName && res.user) {
        await updateProfile(res.user, { displayName });
      }
      user.value = res.user;
      return res.user;
    } catch (err: any) {
      error.value = err.message || 'Failed to register account';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const loginAnonymously = async () => {
    loading.value = true;
    error.value = null;
    try {
      const res = await signInAnonymously(auth);
      user.value = res.user;
      return res.user;
    } catch (err: any) {
      error.value = err.message || 'Failed to sign in as guest';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    loading.value = true;
    error.value = null;
    try {
      await firebaseSignOut(auth);
      user.value = null;
    } catch (err: any) {
      error.value = err.message || 'Failed to sign out';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  if (getCurrentInstance()) {
    onMounted(() => {
      initAuth();
    });
  } else {
    initAuth();
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    isAnonymous,
    initAuth,
    loginWithEmail,
    registerWithEmail,
    loginAnonymously,
    logout,
  };
}

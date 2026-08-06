import { ref, onMounted, onUnmounted } from 'vue';
import { onAuthStateChanged, signInAnonymously, signOut as firebaseSignOut, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const user = ref<User | null>(null);
const loading = ref<boolean>(true);
const error = ref<string | null>(null);
let unsubscribe: (() => void) | null = null;

/**
 * Composable for managing Firebase authentication state and actions.
 */
export function useAuth() {
  const initAuth = () => {
    if (unsubscribe) return;
    
    loading.value = true;
    error.value = null;

    unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        user.value = currentUser;
        
        // Auto sign-in anonymously for frictionless local development if user is null
        if (!currentUser) {
          try {
            const credential = await signInAnonymously(auth);
            user.value = credential.user;
          } catch (err: any) {
            console.error('Anonymous auth error:', err);
            error.value = err?.message || 'Failed to authenticate anonymously';
          }
        }
        loading.value = false;
      },
      (err) => {
        error.value = err.message;
        loading.value = false;
      }
    );
  };

  const loginAnonymously = async () => {
    loading.value = true;
    error.value = null;
    try {
      const res = await signInAnonymously(auth);
      user.value = res.user;
      return res.user;
    } catch (err: any) {
      error.value = err.message || 'Failed to sign in';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    loading.value = true;
    try {
      await firebaseSignOut(auth);
      user.value = null;
    } catch (err: any) {
      error.value = err.message || 'Failed to sign out';
    } finally {
      loading.value = false;
    }
  };

  onMounted(() => {
    initAuth();
  });

  return {
    user,
    loading,
    error,
    loginAnonymously,
    logout,
  };
}

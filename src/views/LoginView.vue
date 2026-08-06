<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import { Wallet, Mail, Lock, User, LogIn, UserPlus, Eye, EyeOff, AlertCircle, ArrowRight, Sparkles } from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const { loginWithEmail, registerWithEmail, loginAnonymously, loading, error } = useAuth();

const isSignUp = ref(false);
const email = ref('');
const password = ref('');
const displayName = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const formError = ref<string | null>(null);

const redirectTarget = computedRedirect();

function computedRedirect() {
  const redirect = route.query.redirect as string;
  return redirect && redirect !== '/login' ? redirect : '/';
}

const handleSubmit = async () => {
  formError.value = null;

  if (!email.value || !password.value) {
    formError.value = 'Please fill in all required fields.';
    return;
  }

  if (isSignUp.value) {
    if (password.value.length < 6) {
      formError.value = 'Password must be at least 6 characters long.';
      return;
    }
    if (password.value !== confirmPassword.value) {
      formError.value = 'Passwords do not match.';
      return;
    }
  }

  try {
    if (isSignUp.value) {
      await registerWithEmail(email.value, password.value, displayName.value);
    } else {
      await loginWithEmail(email.value, password.value);
    }
    router.push(redirectTarget);
  } catch (err: any) {
    formError.value = parseAuthError(err?.code || err?.message);
  }
};

const handleGuestLogin = async () => {
  formError.value = null;
  try {
    await loginAnonymously();
    router.push(redirectTarget);
  } catch (err: any) {
    formError.value = 'Failed to sign in as guest. Please try again.';
  }
};

function parseAuthError(codeOrMsg: string): string {
  if (codeOrMsg.includes('user-not-found') || codeOrMsg.includes('wrong-password') || codeOrMsg.includes('invalid-credential')) {
    return 'Invalid email or password.';
  }
  if (codeOrMsg.includes('email-already-in-use')) {
    return 'This email address is already registered.';
  }
  if (codeOrMsg.includes('invalid-email')) {
    return 'Please enter a valid email address.';
  }
  if (codeOrMsg.includes('weak-password')) {
    return 'Password is too weak. Choose at least 6 characters.';
  }
  return codeOrMsg || 'Authentication failed. Please try again.';
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-backdrop">
      <div class="glow-orb orb-1"></div>
      <div class="glow-orb orb-2"></div>
    </div>

    <div class="auth-container">
      <div class="auth-card glass-panel">
        <div class="card-header">
          <div class="brand-badge-container">
            <div class="brand-logo">
              <Wallet :size="28" class="logo-icon" />
            </div>
          </div>
          <h1 class="brand-title">DUIT <span class="badge">PRO</span></h1>
          <p class="brand-subtitle">Smart Multi-Account Financial Record Keeping</p>
        </div>

        <div class="auth-tabs">
          <button
            class="tab-btn"
            :class="{ active: !isSignUp }"
            @click="isSignUp = false; formError = null"
          >
            <LogIn :size="16" /> Sign In
          </button>
          <button
            class="tab-btn"
            :class="{ active: isSignUp }"
            @click="isSignUp = true; formError = null"
          >
            <UserPlus :size="16" /> Create Account
          </button>
        </div>

        <div v-if="formError || error" class="alert-banner error-banner">
          <AlertCircle :size="18" class="alert-icon" />
          <span>{{ formError || error }}</span>
        </div>

        <form @submit.prevent="handleSubmit" class="auth-form">
          <div v-if="isSignUp" class="form-group">
            <label for="displayName" class="input-label">Full Name</label>
            <div class="input-wrapper">
              <User :size="18" class="input-icon" />
              <input
                id="displayName"
                v-model="displayName"
                type="text"
                class="form-input"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="email" class="input-label">Email Address</label>
            <div class="input-wrapper">
              <Mail :size="18" class="input-icon" />
              <input
                id="email"
                v-model="email"
                type="email"
                required
                class="form-input"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="password" class="input-label">Password</label>
            <div class="input-wrapper">
              <Lock :size="18" class="input-icon" />
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                class="form-input"
                placeholder="••••••••"
              />
              <button
                type="button"
                class="toggle-eye"
                @click="showPassword = !showPassword"
                title="Toggle password visibility"
              >
                <EyeOff v-if="showPassword" :size="18" />
                <Eye v-else :size="18" />
              </button>
            </div>
          </div>

          <div v-if="isSignUp" class="form-group">
            <label for="confirmPassword" class="input-label">Confirm Password</label>
            <div class="input-wrapper">
              <Lock :size="18" class="input-icon" />
              <input
                id="confirmPassword"
                v-model="confirmPassword"
                :type="showPassword ? 'text' : 'password'"
                required
                class="form-input"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button type="submit" class="btn btn-primary submit-btn" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            <span v-else class="btn-content">
              {{ isSignUp ? 'Create Account' : 'Sign In' }}
              <ArrowRight :size="18" />
            </span>
          </button>
        </form>

        <div class="divider">
          <span>OR</span>
        </div>

        <button
          type="button"
          class="btn btn-guest"
          @click="handleGuestLogin"
          :disabled="loading"
        >
          <Sparkles :size="18" class="guest-icon" />
          <span>Continue as Guest</span>
        </button>

        <div class="card-footer">
          <p v-if="!isSignUp">
            Don't have an account?
            <a href="#" @click.prevent="isSignUp = true" class="link-btn">Create one now</a>
          </p>
          <p v-else>
            Already have an account?
            <a href="#" @click.prevent="isSignUp = false" class="link-btn">Sign in here</a>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 24px;
  background: var(--bg-dark, #0b0f17);
}

.auth-backdrop {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.25;
}

.orb-1 {
  width: 400px;
  height: 400px;
  background: #6366f1;
  top: -100px;
  left: -100px;
}

.orb-2 {
  width: 450px;
  height: 450px;
  background: #a855f7;
  bottom: -120px;
  right: -120px;
}

.auth-container {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 440px;
}

.auth-card {
  padding: 36px;
  border-radius: var(--radius-xl, 20px);
  background: rgba(18, 24, 38, 0.75);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.card-header {
  text-align: center;
  margin-bottom: 28px;
}

.brand-badge-container {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.brand-logo {
  width: 54px;
  height: 54px;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.35);
}

.brand-title {
  font-size: 1.8rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  color: #ffffff;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.badge {
  font-size: 0.7rem;
  font-weight: 800;
  padding: 2px 8px;
  background: rgba(99, 102, 241, 0.2);
  color: var(--accent-primary, #6366f1);
  border-radius: 6px;
  border: 1px solid rgba(99, 102, 241, 0.3);
}

.brand-subtitle {
  color: var(--text-muted, #94a3b8);
  font-size: 0.88rem;
  margin-top: 6px;
}

.auth-tabs {
  display: flex;
  gap: 6px;
  background: rgba(255, 255, 255, 0.05);
  padding: 4px;
  border-radius: 12px;
  margin-bottom: 24px;
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--text-muted, #94a3b8);
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn.active {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.alert-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 0.88rem;
  margin-bottom: 20px;
}

.error-banner {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

.alert-icon {
  flex-shrink: 0;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-secondary, #cbd5e1);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
  color: var(--text-muted, #64748b);
  pointer-events: none;
}

.form-input {
  width: 100%;
  padding: 12px 14px 12px 42px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  color: #ffffff;
  font-size: 0.95rem;
  outline: none;
  transition: all 0.2s ease;
}

.form-input:focus {
  border-color: var(--accent-primary, #6366f1);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
  background: rgba(15, 23, 42, 0.85);
}

.toggle-eye {
  position: absolute;
  right: 14px;
  background: none;
  border: none;
  color: var(--text-muted, #64748b);
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
}

.toggle-eye:hover {
  color: #ffffff;
}

.submit-btn {
  margin-top: 8px;
  width: 100%;
  padding: 13px;
  border-radius: 10px;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: #ffffff;
  font-weight: 700;
  font-size: 0.95rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 22px 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.divider span {
  padding: 0 12px;
  color: var(--text-muted, #64748b);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.btn-guest {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: var(--text-primary, #ffffff);
  font-weight: 600;
  font-size: 0.92rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.2s ease;
}

.btn-guest:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.guest-icon {
  color: #fbbf24;
}

.card-footer {
  margin-top: 24px;
  text-align: center;
  font-size: 0.88rem;
  color: var(--text-muted, #94a3b8);
}

.link-btn {
  color: var(--accent-primary, #818cf8);
  text-decoration: none;
  font-weight: 600;
  margin-left: 4px;
}

.link-btn:hover {
  text-decoration: underline;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  display: inline-block;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

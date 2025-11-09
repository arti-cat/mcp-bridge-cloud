<script>
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import { supabase } from '../lib/supabaseClient.js';

  const dispatch = createEventDispatcher();

  let verifying = true;
  let error = '';
  let success = false;

  onMount(async () => {
    // Get token from URL parameters
    const params = new URLSearchParams(window.location.search);
    const token_hash = params.get('token_hash');
    const type = params.get('type');

    if (token_hash && type === 'email') {
      try {
        // Verify the email confirmation token
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash,
          type: 'email',
        });

        if (verifyError) {
          error = verifyError.message;
          verifying = false;
        } else {
          // Success - show confirmation and redirect
          success = true;
          verifying = false;

          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            dispatch('navigate', { route: 'dashboard' });
          }, 2000);
        }
      } catch (err) {
        error = err.message || 'An unexpected error occurred';
        verifying = false;
      }
    } else {
      error = 'Invalid confirmation link. Please check your email and try again.';
      verifying = false;
    }
  });
</script>

<div class="auth-container">
  <div class="auth-card card">
    {#if verifying}
      <div class="verifying">
        <div class="spinner"></div>
        <h2>Verifying your email...</h2>
        <p>Please wait while we confirm your account.</p>
      </div>
    {:else if success}
      <div class="success">
        <div class="success-icon">✓</div>
        <h2>Email Confirmed!</h2>
        <p>Your account has been successfully verified.</p>
        <p class="redirect-notice">Redirecting to your dashboard...</p>
      </div>
    {:else if error}
      <div class="alert error">
        <h3>Verification Failed</h3>
        <p>{error}</p>
      </div>
      <div class="actions">
        <button
          class="secondary"
          on:click={() => dispatch('navigate', { route: 'signup' })}
        >
          Back to Sign Up
        </button>
        <button
          class="primary"
          on:click={() => dispatch('navigate', { route: 'login' })}
        >
          Go to Sign In
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  .auth-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: var(--bg);
  }

  .auth-card {
    width: 100%;
    max-width: 420px;
    text-align: center;
  }

  .verifying {
    padding: 2rem 0;
  }

  .spinner {
    width: 48px;
    height: 48px;
    margin: 0 auto 1.5rem;
    border: 4px solid var(--border);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .success {
    padding: 2rem 0;
  }

  .success-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 1rem;
    background: var(--success);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    font-weight: bold;
  }

  h2 {
    color: var(--text);
    margin-bottom: 0.5rem;
  }

  p {
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
  }

  .redirect-notice {
    font-size: 0.875rem;
    color: var(--text-muted);
    margin-top: 1rem;
  }

  .actions {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
  }

  .actions button {
    flex: 1;
  }

  button.primary {
    background: var(--primary);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    cursor: pointer;
    font-weight: 500;
  }

  button.primary:hover {
    background: var(--primary-hover);
  }

  button.secondary {
    background: transparent;
    color: var(--text);
    border: 1px solid var(--border);
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    cursor: pointer;
    font-weight: 500;
  }

  button.secondary:hover {
    background: var(--bg-secondary);
  }
</style>

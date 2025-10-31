<script>
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import { supabase, updatePassword } from '../lib/supabaseClient.js';

  const dispatch = createEventDispatcher();

  let password = '';
  let confirmPassword = '';
  let error = '';
  let success = false;
  let loading = false;
  let checkingSession = true;
  let hasSession = false;

  onMount(async () => {
    // Give Supabase a moment to process the URL hash
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if we have a session from the reset link
    const { data: { session } } = await supabase.auth.getSession();

    checkingSession = false;

    if (session) {
      hasSession = true;
    } else {
      error = 'Auth session missing!';
    }
  });

  function validatePasswords() {
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }
    return null;
  }

  async function handleSubmit() {
    error = '';

    const validationError = validatePasswords();
    if (validationError) {
      error = validationError;
      return;
    }

    loading = true;

    const { error: updateError } = await updatePassword(password);

    loading = false;

    if (updateError) {
      error = updateError.message;
    } else {
      success = true;
      // Auto-redirect to login after 3 seconds
      setTimeout(() => {
        dispatch('complete');
      }, 3000);
    }
  }

  function requestNewLink() {
    dispatch('complete'); // Go back to login, they can request forgot password again
  }
</script>

<div class="auth-container">
  <div class="auth-card card">
    <h1>Set New Password</h1>
    <p class="subtitle">Enter your new password below</p>

    {#if checkingSession}
      <div class="loading-container">
        <div class="loading"></div>
        <p>Verifying reset link...</p>
      </div>
    {:else if success}
      <div class="alert success">
        <strong>Password updated successfully!</strong>
        <p>Redirecting to login page...</p>
      </div>
    {:else if !hasSession}
      <div class="alert error">
        <strong>Invalid or Expired Reset Link</strong>
        <p>This password reset link is invalid or has expired. Reset links can only be used once and expire after 1 hour.</p>
      </div>

      <button type="button" class="full-width" on:click={requestNewLink}>
        Request New Reset Link
      </button>
    {:else}
      {#if error}
        <div class="alert error">{error}</div>
      {/if}

      <form on:submit|preventDefault={handleSubmit}>
        <div class="form-group">
          <label for="password">New Password</label>
          <input
            id="password"
            type="password"
            bind:value={password}
            placeholder="At least 8 characters"
            required
            minlength="8"
            disabled={loading}
          />
        </div>

        <div class="form-group">
          <label for="confirm-password">Confirm New Password</label>
          <input
            id="confirm-password"
            type="password"
            bind:value={confirmPassword}
            placeholder="Re-enter password"
            required
            minlength="8"
            disabled={loading}
          />
        </div>

        {#if password.length > 0 && password.length < 8}
          <p class="hint error-hint">Password must be at least 8 characters</p>
        {/if}

        {#if password.length >= 8 && confirmPassword.length > 0 && password !== confirmPassword}
          <p class="hint error-hint">Passwords do not match</p>
        {/if}

        {#if password.length >= 8 && confirmPassword.length >= 8 && password === confirmPassword}
          <p class="hint success-hint">✓ Passwords match</p>
        {/if}

        <button
          type="submit"
          class="full-width"
          disabled={loading || password.length < 8 || password !== confirmPassword}
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
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
  }

  .auth-card {
    width: 100%;
    max-width: 420px;
  }

  h1 {
    text-align: center;
    color: var(--primary);
    margin-bottom: 0.5rem;
  }

  .subtitle {
    text-align: center;
    color: var(--text-secondary);
    margin-bottom: 2rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--text);
  }

  .full-width {
    width: 100%;
    margin-top: 0.5rem;
  }

  .hint {
    font-size: 0.85rem;
    margin-top: -0.5rem;
    margin-bottom: 1rem;
  }

  .error-hint {
    color: var(--error);
  }

  .success-hint {
    color: #28a745;
  }

  .alert.success {
    background: #d4edda;
    border-color: #c3e6cb;
    color: #155724;
  }

  .alert.success strong {
    display: block;
    margin-bottom: 0.5rem;
  }

  .alert.success p {
    margin: 0.5rem 0;
    font-size: 0.95rem;
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 2rem;
  }

  .loading {
    border: 3px solid #f3f3f3;
    border-top: 3px solid var(--primary);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .loading-container p {
    color: var(--text-secondary);
    margin: 0;
  }
</style>

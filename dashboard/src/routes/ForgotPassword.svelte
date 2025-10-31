<script>
  import { createEventDispatcher } from 'svelte';
  import { sendPasswordResetEmail } from '../lib/supabaseClient.js';

  const dispatch = createEventDispatcher();

  let email = '';
  let error = '';
  let success = false;
  let loading = false;

  async function handleSubmit() {
    error = '';
    loading = true;

    const { error: resetError } = await sendPasswordResetEmail(email);

    loading = false;

    if (resetError) {
      error = resetError.message;
    } else {
      success = true;
    }
  }
</script>

<div class="auth-container">
  <div class="auth-card card">
    <h1>Reset Password</h1>
    <p class="subtitle">Enter your email to receive a password reset link</p>

    {#if success}
      <div class="alert success">
        <strong>Check your email!</strong>
        <p>We've sent a password reset link to <strong>{email}</strong></p>
        <p>Click the link in the email to reset your password.</p>
      </div>

      <button class="full-width secondary" on:click={() => dispatch('navigate')}>
        Back to Login
      </button>
    {:else}
      {#if error}
        <div class="alert error">{error}</div>
      {/if}

      <form on:submit|preventDefault={handleSubmit}>
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            type="email"
            bind:value={email}
            placeholder="you@example.com"
            required
            disabled={loading}
          />
        </div>

        <button type="submit" class="full-width" disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      <p class="switch-auth">
        Remember your password?
        <button class="link" on:click={() => dispatch('navigate')}>Sign in</button>
      </p>
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

  .switch-auth {
    text-align: center;
    margin-top: 1.5rem;
    color: var(--text-secondary);
  }

  button.link {
    background: none;
    border: none;
    color: var(--primary);
    text-decoration: underline;
    padding: 0;
    cursor: pointer;
  }

  button.link:hover {
    color: var(--primary-hover);
  }

  button.secondary {
    background: var(--bg-secondary);
    color: var(--text);
  }

  button.secondary:hover {
    background: var(--bg-tertiary);
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
</style>

<script>
  import { createEventDispatcher } from 'svelte';
  import { signIn } from '../lib/supabaseClient.js';

  const dispatch = createEventDispatcher();

  let email = '';
  let password = '';
  let error = '';
  let loading = false;

  async function handleSubmit() {
    error = '';
    loading = true;

    const { error: authError } = await signIn(email, password);

    loading = false;

    if (authError) {
      error = authError.message;
    }
  }
</script>

<div class="auth-container">
  <div class="auth-card card">
    <h1>MCP Bridge Cloud</h1>
    <p class="subtitle">Sign in to your account</p>

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

      <div class="form-group">
        <label for="password">Password</label>
        <input
          id="password"
          type="password"
          bind:value={password}
          placeholder="••••••••"
          required
          disabled={loading}
        />
      </div>

      <button type="submit" class="full-width" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>

    <p class="switch-auth">
      Don't have an account?
      <button class="link" on:click={() => dispatch('navigate')}>Sign up</button>
    </p>
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
</style>

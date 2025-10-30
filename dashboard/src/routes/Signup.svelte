<script>
  import { createEventDispatcher } from 'svelte';
  import { signUp } from '../lib/supabaseClient.js';
  import { createUserAccount, checkSubdomain } from '../lib/api.js';

  const dispatch = createEventDispatcher();

  let email = '';
  let password = '';
  let username = '';
  let subdomain = '';
  let error = '';
  let loading = false;
  let checkingSubdomain = false;
  let subdomainAvailable = null;

  // Auto-fill subdomain from username
  $: if (username && !subdomain) {
    subdomain = username.toLowerCase().replace(/[^a-z0-9-]/g, '');
  }

  async function handleSubdomainCheck() {
    if (!subdomain || subdomain.length < 3) {
      subdomainAvailable = null;
      return;
    }

    checkingSubdomain = true;
    try {
      const result = await checkSubdomain(subdomain);
      subdomainAvailable = result.available;
    } catch (err) {
      subdomainAvailable = false;
    }
    checkingSubdomain = false;
  }

  async function handleSubmit() {
    error = '';

    // Validate subdomain
    if (!subdomain || subdomain.length < 3) {
      error = 'Subdomain must be at least 3 characters';
      return;
    }

    if (!/^[a-z0-9-]+$/.test(subdomain)) {
      error = 'Subdomain can only contain lowercase letters, numbers, and hyphens';
      return;
    }

    if (password.length < 8) {
      error = 'Password must be at least 8 characters';
      return;
    }

    loading = true;

    try {
      // Step 1: Create Supabase auth user
      const { data: authData, error: authError } = await signUp(email, password, {
        username,
        subdomain,
      });

      if (authError) throw authError;

      // Step 2: Create user account in our database
      await createUserAccount(username, subdomain);

      // Success - auth state will update automatically
    } catch (err) {
      error = err.message;
      loading = false;
    }
  }
</script>

<div class="auth-container">
  <div class="auth-card card">
    <h1>MCP Bridge Cloud</h1>
    <p class="subtitle">Create your account</p>

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
        <label for="username">Username</label>
        <input
          id="username"
          type="text"
          bind:value={username}
          placeholder="johndoe"
          required
          disabled={loading}
          minlength="3"
        />
      </div>

      <div class="form-group">
        <label for="subdomain">Subdomain</label>
        <div class="subdomain-input">
          <input
            id="subdomain"
            type="text"
            bind:value={subdomain}
            on:blur={handleSubdomainCheck}
            placeholder="yourname"
            required
            disabled={loading}
            minlength="3"
            pattern="[a-z0-9-]+"
          />
          <span class="domain-suffix">.mcp-bridge.xyz</span>
        </div>
        {#if checkingSubdomain}
          <p class="hint">Checking availability...</p>
        {:else if subdomainAvailable === true}
          <p class="hint success">✓ Available</p>
        {:else if subdomainAvailable === false}
          <p class="hint error">✗ Not available</p>
        {/if}
        <p class="hint">This will be your permanent tunnel URL</p>
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
          minlength="8"
        />
        <p class="hint">Minimum 8 characters</p>
      </div>

      <button type="submit" class="full-width" disabled={loading || subdomainAvailable === false}>
        {loading ? 'Creating account...' : 'Sign Up'}
      </button>
    </form>

    <p class="switch-auth">
      Already have an account?
      <button class="link" on:click={() => dispatch('navigate')}>Sign in</button>
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

  .subdomain-input {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .subdomain-input input {
    flex: 1;
  }

  .domain-suffix {
    color: var(--text-secondary);
    font-size: 0.875rem;
    white-space: nowrap;
  }

  .hint {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-top: 0.25rem;
    margin-bottom: 0;
  }

  .hint.success {
    color: var(--success);
  }

  .hint.error {
    color: var(--error);
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

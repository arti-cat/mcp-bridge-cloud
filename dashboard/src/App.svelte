<script>
  import { onMount } from 'svelte';
  import { supabase, onAuthStateChange } from './lib/supabaseClient.js';
  import Login from './routes/Login.svelte';
  import Signup from './routes/Signup.svelte';
  import Dashboard from './routes/Dashboard.svelte';
  import ForgotPassword from './routes/ForgotPassword.svelte';
  import ResetPassword from './routes/ResetPassword.svelte';

  let session = null;
  let currentRoute = 'login';
  let loading = true;

  // Check for hash-based routes and password reset tokens
  function checkHashRoute() {
    const hash = window.location.hash;

    // Check if this is a password reset from Supabase email link
    // Supabase adds #access_token=... or type=recovery in the URL
    if (hash.includes('type=recovery') || (hash.includes('access_token') && hash.includes('type='))) {
      currentRoute = 'reset-password';
      return;
    }

    if (hash.includes('#/reset-password')) {
      currentRoute = 'reset-password';
    } else if (hash.includes('#/forgot-password')) {
      currentRoute = 'forgot-password';
    }
  }

  onMount(() => {
    // Check for hash routes first (especially password reset tokens)
    checkHashRoute();

    // Check initial session
    supabase.auth.getSession().then(({ data }) => {
      session = data.session;
      loading = false;
    });

    // Listen for auth changes
    const { data: authListener } = onAuthStateChange((event, newSession) => {
      session = newSession;
      if (event === 'SIGNED_OUT') {
        currentRoute = 'login';
        window.location.hash = '';
      }
    });

    // Listen for hash changes
    const handleHashChange = () => {
      checkHashRoute();
    };
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      authListener.subscription.unsubscribe();
      window.removeEventListener('hashchange', handleHashChange);
    };
  });

  function navigate(event) {
    const route = event.detail?.route || 'signup';
    currentRoute = route;

    // Update hash for password reset routes
    if (route === 'forgot-password') {
      window.location.hash = '#/forgot-password';
    } else if (route === 'reset-password') {
      window.location.hash = '#/reset-password';
    } else {
      window.location.hash = '';
    }
  }
</script>

{#if loading}
  <div class="loading-container">
    <div class="loading"></div>
    <p>Loading...</p>
  </div>
{:else if session && currentRoute !== 'reset-password'}
  <Dashboard />
{:else}
  {#if currentRoute === 'login'}
    <Login on:navigate={navigate} />
  {:else if currentRoute === 'signup'}
    <Signup on:navigate={() => navigate({ detail: { route: 'login' }})} />
  {:else if currentRoute === 'forgot-password'}
    <ForgotPassword on:navigate={() => navigate({ detail: { route: 'login' }})} />
  {:else if currentRoute === 'reset-password'}
    <ResetPassword on:complete={() => navigate({ detail: { route: 'login' }})} />
  {/if}
{/if}

<style>
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    gap: 1rem;
  }
</style>

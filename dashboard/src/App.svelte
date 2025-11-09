<script>
  import { onMount } from 'svelte';
  import { supabase, onAuthStateChange } from './lib/supabaseClient.js';
  import Home from './routes/Home.svelte';
  import Login from './routes/Login.svelte';
  import Signup from './routes/Signup.svelte';
  import Dashboard from './routes/Dashboard.svelte';
  import ForgotPassword from './routes/ForgotPassword.svelte';
  import ResetPassword from './routes/ResetPassword.svelte';
  import AuthConfirm from './routes/AuthConfirm.svelte';

  let session = null;
  let currentRoute = 'home';
  let loading = true;

  // Check for hash-based routes and password reset tokens
  function checkHashRoute() {
    const hash = window.location.hash;
    const search = window.location.search;

    // Check for email confirmation from Supabase (query params: ?token_hash=...&type=email)
    if (search.includes('token_hash') && search.includes('type=email')) {
      currentRoute = 'auth-confirm';
      return;
    }

    // Check if this is a password reset from Supabase email link
    // Supabase adds #access_token=... or type=recovery in the URL
    if (hash.includes('type=recovery') || (hash.includes('access_token') && hash.includes('type='))) {
      currentRoute = 'reset-password';
      return;
    }

    // Route based on hash
    if (hash.includes('#/login')) {
      currentRoute = 'login';
    } else if (hash.includes('#/signup')) {
      currentRoute = 'signup';
    } else if (hash.includes('#/reset-password')) {
      currentRoute = 'reset-password';
    } else if (hash.includes('#/forgot-password')) {
      currentRoute = 'forgot-password';
    } else if (hash.includes('#/auth/confirm')) {
      currentRoute = 'auth-confirm';
    } else if (hash === '' || hash === '#' || hash === '#/') {
      currentRoute = 'home';
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
        currentRoute = 'home';
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
    const route = event.detail?.route || 'home';
    currentRoute = route;

    // Update hash for all routes
    if (route === 'home') {
      window.location.hash = '';
    } else if (route === 'login') {
      window.location.hash = '#/login';
    } else if (route === 'signup') {
      window.location.hash = '#/signup';
    } else if (route === 'forgot-password') {
      window.location.hash = '#/forgot-password';
    } else if (route === 'reset-password') {
      window.location.hash = '#/reset-password';
    } else if (route === 'dashboard') {
      // Clear any query params and go to dashboard (requires session)
      window.location.href = window.location.pathname;
    }
  }
</script>

{#if loading}
  <div class="loading-container">
    <div class="loading"></div>
    <p>Loading...</p>
  </div>
{:else if session && currentRoute !== 'reset-password' && currentRoute !== 'auth-confirm'}
  <Dashboard />
{:else}
  {#if currentRoute === 'home'}
    <Home on:navigate={navigate} />
  {:else if currentRoute === 'login'}
    <Login on:navigate={navigate} />
  {:else if currentRoute === 'signup'}
    <Signup on:navigate={() => navigate({ detail: { route: 'login' }})} />
  {:else if currentRoute === 'forgot-password'}
    <ForgotPassword on:navigate={() => navigate({ detail: { route: 'login' }})} />
  {:else if currentRoute === 'reset-password'}
    <ResetPassword on:complete={() => navigate({ detail: { route: 'login' }})} />
  {:else if currentRoute === 'auth-confirm'}
    <AuthConfirm on:navigate={navigate} />
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

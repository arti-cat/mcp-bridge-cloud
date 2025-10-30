<script>
  import { onMount } from 'svelte';
  import { supabase, onAuthStateChange } from './lib/supabaseClient.js';
  import Login from './routes/Login.svelte';
  import Signup from './routes/Signup.svelte';
  import Dashboard from './routes/Dashboard.svelte';

  let session = null;
  let currentRoute = 'login';
  let loading = true;

  onMount(() => {
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
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  });

  function navigate(route) {
    currentRoute = route;
  }
</script>

{#if loading}
  <div class="loading-container">
    <div class="loading"></div>
    <p>Loading...</p>
  </div>
{:else if session}
  <Dashboard />
{:else}
  {#if currentRoute === 'login'}
    <Login on:navigate={() => navigate('signup')} />
  {:else}
    <Signup on:navigate={() => navigate('login')} />
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

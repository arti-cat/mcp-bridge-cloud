<script>
  import { onMount } from 'svelte';
  import { signOut } from '../lib/supabaseClient.js';
  import { getAccount, getMetrics } from '../lib/api.js';
  import TunnelStatus from '../components/TunnelStatus.svelte';
  import ApiKeyDisplay from '../components/ApiKeyDisplay.svelte';
  import UsageMetrics from '../components/UsageMetrics.svelte';

  let account = null;
  let metrics = null;
  let loading = true;
  let error = '';

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    try {
      [account, metrics] = await Promise.all([
        getAccount(),
        getMetrics(),
      ]);
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  async function handleSignOut() {
    await signOut();
  }

  async function handleRefresh() {
    loading = true;
    await loadData();
  }
</script>

<div class="dashboard">
  <header class="header">
    <div class="container">
      <h1>MCP Bridge Cloud</h1>
      <button class="secondary" on:click={handleSignOut}>Sign Out</button>
    </div>
  </header>

  <main class="container main-content">
    {#if loading}
      <div class="loading-state">
        <div class="loading"></div>
        <p>Loading your dashboard...</p>
      </div>
    {:else if error}
      <div class="alert error">
        {error}
        <button on:click={handleRefresh}>Retry</button>
      </div>
    {:else if account}
      <div class="dashboard-grid">
        <section class="welcome-section card">
          <h2>Welcome, {account.username}!</h2>
          <p>Your persistent tunnel URL:</p>
          <div class="tunnel-url">
            <code>https://{account.subdomain}.mcp-bridge.xyz</code>
            <button class="secondary" on:click={() => navigator.clipboard.writeText(`https://${account.subdomain}.mcp-bridge.xyz`)}>
              Copy
            </button>
          </div>
        </section>

        <TunnelStatus subdomain={account.subdomain} />

        <ApiKeyDisplay apiKey={account.api_key} on:refresh={handleRefresh} />

        <UsageMetrics {metrics} />

        <section class="instructions card">
          <h3>Getting Started</h3>
          <p>Connect your local MCP server to the cloud:</p>
          <div class="code-block">
            mcp-bridge --cloud --api-key {account.api_key}
          </div>
          <p class="hint">Add this URL to ChatGPT's custom actions:</p>
          <div class="code-block">
            https://{account.subdomain}.mcp-bridge.xyz
          </div>
        </section>
      </div>
    {/if}
  </main>
</div>

<style>
  .dashboard {
    min-height: 100vh;
  }

  .header {
    background-color: var(--bg);
    border-bottom: 1px solid var(--border);
    padding: 1rem 0;
  }

  .header .container {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header h1 {
    font-size: 1.5rem;
    margin: 0;
    color: var(--primary);
  }

  .main-content {
    padding: 2rem 1rem;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
    gap: 1rem;
  }

  .dashboard-grid {
    display: grid;
    gap: 1.5rem;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }

  .welcome-section {
    grid-column: 1 / -1;
  }

  .tunnel-url {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
    flex-wrap: wrap;
  }

  .tunnel-url code {
    flex: 1;
    min-width: 200px;
  }

  .instructions {
    grid-column: 1 / -1;
  }

  .instructions h3 {
    margin-bottom: 1rem;
  }

  .instructions p {
    margin-bottom: 0.5rem;
  }

  .instructions .hint {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-top: 1rem;
  }
</style>

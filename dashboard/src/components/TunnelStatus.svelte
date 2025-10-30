<script>
  import { onMount, onDestroy } from 'svelte';

  export let subdomain;

  let status = 'checking';
  let lastSeen = null;
  let interval;

  onMount(() => {
    checkStatus();
    // Check status every 10 seconds
    interval = setInterval(checkStatus, 10000);
  });

  onDestroy(() => {
    if (interval) clearInterval(interval);
  });

  async function checkStatus() {
    try {
      const response = await fetch(`/api/status/${subdomain}`);
      const data = await response.json();
      status = data.status;
      lastSeen = data.last_seen;
    } catch (err) {
      status = 'error';
    }
  }
</script>

<section class="card status-card">
  <h3>Tunnel Status</h3>
  <div class="status-display">
    <div class="status-indicator {status}"></div>
    <div class="status-text">
      {#if status === 'connected'}
        <strong>Connected</strong>
        <p>Your tunnel is active and ready</p>
      {:else if status === 'disconnected'}
        <strong>Disconnected</strong>
        <p>Start your local mcp-bridge to connect</p>
      {:else if status === 'checking'}
        <strong>Checking...</strong>
        <p>Verifying connection status</p>
      {:else}
        <strong>Error</strong>
        <p>Unable to check status</p>
      {/if}
    </div>
  </div>
  {#if lastSeen}
    <p class="last-seen">Last seen: {new Date(lastSeen).toLocaleString()}</p>
  {/if}
</section>

<style>
  .status-card h3 {
    margin-bottom: 1rem;
  }

  .status-display {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .status-indicator {
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .status-indicator.connected {
    background-color: var(--success);
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2);
  }

  .status-indicator.disconnected {
    background-color: var(--text-secondary);
  }

  .status-indicator.checking {
    background-color: var(--warning);
    animation: pulse 2s infinite;
  }

  .status-indicator.error {
    background-color: var(--error);
  }

  .status-text strong {
    display: block;
    margin-bottom: 0.25rem;
  }

  .status-text p {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin: 0;
  }

  .last-seen {
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin-top: 1rem;
    margin-bottom: 0;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
</style>

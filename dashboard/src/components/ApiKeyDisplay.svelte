<script>
  import { createEventDispatcher } from 'svelte';
  import { regenerateApiKey } from '../lib/api.js';

  const dispatch = createEventDispatcher();

  export let apiKey;

  let showKey = false;
  let regenerating = false;
  let copied = false;

  async function handleCopy() {
    await navigator.clipboard.writeText(apiKey);
    copied = true;
    setTimeout(() => {
      copied = false;
    }, 2000);
  }

  async function handleRegenerate() {
    if (!confirm('Are you sure? Your old API key will stop working immediately.')) {
      return;
    }

    regenerating = true;
    try {
      await regenerateApiKey();
      dispatch('refresh');
      alert('API key regenerated successfully!');
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      regenerating = false;
    }
  }
</script>

<section class="card api-key-card">
  <h3>API Key</h3>
  <p class="description">Use this key to connect your local mcp-bridge to the cloud</p>

  <div class="key-display">
    <code class="key-value">
      {showKey ? apiKey : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
    </code>
    <button class="secondary icon-button" on:click={() => showKey = !showKey} title={showKey ? 'Hide' : 'Show'}>
      {showKey ? '🙈' : '👁️'}
    </button>
  </div>

  <div class="actions">
    <button class="secondary" on:click={handleCopy} disabled={copied}>
      {copied ? '✓ Copied!' : 'Copy Key'}
    </button>
    <button class="danger" on:click={handleRegenerate} disabled={regenerating}>
      {regenerating ? 'Regenerating...' : 'Regenerate'}
    </button>
  </div>
</section>

<style>
  .api-key-card h3 {
    margin-bottom: 0.5rem;
  }

  .description {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: 1rem;
  }

  .key-display {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .key-value {
    flex: 1;
    padding: 0.75rem;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    font-size: 0.75rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .icon-button {
    padding: 0.75rem;
    min-width: auto;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
</style>

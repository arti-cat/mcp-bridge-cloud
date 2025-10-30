<script>
  export let metrics;

  $: totalRequests = metrics?.requests_count || 0;
  $: connected = metrics?.status === 'connected';
</script>

<section class="card metrics-card">
  <h3>Usage Statistics</h3>

  <div class="metrics-grid">
    <div class="metric">
      <div class="metric-value">{totalRequests.toLocaleString()}</div>
      <div class="metric-label">Total Requests</div>
    </div>

    <div class="metric">
      <div class="metric-value badge {connected ? 'success' : 'error'}">
        {connected ? 'Active' : 'Offline'}
      </div>
      <div class="metric-label">Current Status</div>
    </div>
  </div>

  <div class="info-box">
    <p><strong>ℹ️ Free Tier</strong></p>
    <p>Unlimited requests during beta. Billing will be introduced later.</p>
  </div>
</section>

<style>
  .metrics-card h3 {
    margin-bottom: 1rem;
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .metric {
    text-align: center;
  }

  .metric-value {
    font-size: 2rem;
    font-weight: 700;
    color: var(--primary);
    margin-bottom: 0.5rem;
  }

  .metric-label {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .info-box {
    background-color: var(--bg-secondary);
    border-left: 4px solid var(--primary);
    padding: 1rem;
    border-radius: 0.25rem;
  }

  .info-box p {
    margin: 0;
    font-size: 0.875rem;
  }

  .info-box p:first-child {
    margin-bottom: 0.5rem;
  }
</style>

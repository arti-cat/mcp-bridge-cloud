<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  function navigateToSignup() {
    dispatch('navigate', { route: 'signup' });
  }

  function navigateToLogin() {
    dispatch('navigate', { route: 'login' });
  }

  // Use cases from USE_CASES.md Segment 1
  const useCases = [
    {
      title: 'Small Business Database Queries',
      persona: 'Marcus - Business Owner',
      problem: 'Needed to query sales data without exposing database to internet',
      solution: 'Ask ChatGPT natural language questions about business metrics',
      benefit: 'Database stays secure, team members share one URL',
      icon: '📊'
    },
    {
      title: 'Personal Knowledge Base',
      persona: 'Sarah - Researcher',
      problem: 'Cloudflare tunnel URLs changed on every restart',
      solution: 'Persistent URL that never changes, works forever',
      benefit: 'Configure ChatGPT once, access notes from anywhere',
      icon: '📚'
    },
    {
      title: 'Team Shared Resources',
      persona: 'Startup Team - 5 People',
      problem: 'Each team member needed individual tunnel setup',
      solution: 'Centralized tunnel management with shared URLs',
      benefit: 'One Team plan covers entire team, consistent experience',
      icon: '👥'
    }
  ];

  // Pricing tiers from USE_CASES.md
  const pricingTiers = [
    {
      name: 'Starter',
      price: '$9',
      period: 'per month',
      features: [
        '1 persistent tunnel',
        '10K requests/month',
        'ChatGPT integration',
        'Email support'
      ],
      cta: 'Start Free Trial',
      highlighted: false,
      target: 'Individual users, hobbyists'
    },
    {
      name: 'Pro',
      price: '$19',
      period: 'per month',
      features: [
        '3 persistent tunnels',
        '100K requests/month',
        'Priority support',
        'Analytics dashboard'
      ],
      cta: 'Start Free Trial',
      highlighted: true,
      target: 'Power users, small teams',
      badge: 'Most Popular'
    },
    {
      name: 'Team',
      price: '$49',
      period: 'per month',
      features: [
        '10 persistent tunnels',
        'Unlimited requests',
        'Team management',
        'Dedicated support'
      ],
      cta: 'Start Free Trial',
      highlighted: false,
      target: 'Small businesses, dev teams'
    }
  ];
</script>

<div class="landing-page">
  <!-- Hero Section -->
  <section class="hero">
    <div class="container">
      <div class="hero-content">
        <h1 class="hero-title">Set Up Once, Works Forever</h1>
        <p class="hero-subtitle">
          Persistent HTTPS URLs for your local MCP servers. No more updating ChatGPT
          every time you restart your tunnel.
        </p>
        <div class="hero-cta">
          <button class="cta-primary" on:click={navigateToSignup}>
            Start Free Trial
          </button>
          <button class="cta-secondary secondary" on:click={navigateToLogin}>
            Sign In
          </button>
        </div>
        <p class="hero-hint">
          Get your persistent URL like <code>https://yourname.mcp-bridge.xyz</code>
        </p>
      </div>
    </div>
  </section>

  <!-- Problem/Solution Section -->
  <section class="problem-solution">
    <div class="container">
      <div class="section-header">
        <h2>Stop Reconfiguring ChatGPT</h2>
        <p class="section-subtitle">The tunnel URL problem, solved</p>
      </div>

      <div class="comparison-grid">
        <div class="comparison-card">
          <div class="comparison-badge error">❌ Before</div>
          <h3>Temporary Tunnels</h3>
          <ul class="comparison-list">
            <li>URL changes on every restart</li>
            <li>Update ChatGPT configuration constantly</li>
            <li>Copy/paste new URLs multiple times per week</li>
            <li>Frustrating workflow interruptions</li>
          </ul>
        </div>

        <div class="comparison-card highlight">
          <div class="comparison-badge success">✅ After</div>
          <h3>MCP Bridge Cloud</h3>
          <ul class="comparison-list">
            <li><strong>Persistent URL that never changes</strong></li>
            <li>Configure ChatGPT once, forget about it</li>
            <li>Survives restarts, network changes, ISP reconnections</li>
            <li>Professional, reliable workflow</li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <!-- Use Cases Section -->
  <section class="use-cases">
    <div class="container">
      <div class="section-header">
        <h2>Built for Real-World Use Cases</h2>
        <p class="section-subtitle">See how others are using MCP Bridge Cloud</p>
      </div>

      <div class="use-cases-grid">
        {#each useCases as useCase}
          <div class="use-case-card card">
            <div class="use-case-icon">{useCase.icon}</div>
            <h3>{useCase.title}</h3>
            <p class="persona">{useCase.persona}</p>

            <div class="use-case-content">
              <div class="use-case-item">
                <strong>Problem:</strong>
                <p>{useCase.problem}</p>
              </div>

              <div class="use-case-item">
                <strong>Solution:</strong>
                <p>{useCase.solution}</p>
              </div>

              <div class="use-case-item benefit">
                <strong>Benefit:</strong>
                <p>{useCase.benefit}</p>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- Pricing Section -->
  <section class="pricing">
    <div class="container">
      <div class="section-header">
        <h2>Simple, Transparent Pricing</h2>
        <p class="section-subtitle">Choose the plan that fits your needs</p>
      </div>

      <div class="pricing-grid">
        {#each pricingTiers as tier}
          <div class="pricing-card card {tier.highlighted ? 'highlighted' : ''}">
            {#if tier.badge}
              <div class="pricing-badge">{tier.badge}</div>
            {/if}

            <h3 class="tier-name">{tier.name}</h3>
            <p class="tier-target">{tier.target}</p>

            <div class="tier-price">
              <span class="price">{tier.price}</span>
              <span class="period">/{tier.period.split(' ')[1]}</span>
            </div>

            <ul class="tier-features">
              {#each tier.features as feature}
                <li>✓ {feature}</li>
              {/each}
            </ul>

            <button
              class="tier-cta {tier.highlighted ? '' : 'secondary'}"
              on:click={navigateToSignup}
            >
              {tier.cta}
            </button>
          </div>
        {/each}
      </div>

      <p class="pricing-note">
        All plans include 14-day free trial. No credit card required.
      </p>
    </div>
  </section>

  <!-- Workshop Banner -->
  <section class="workshop-banner">
    <div class="container">
      <div class="banner-content">
        <div class="banner-icon">🎓</div>
        <div class="banner-text">
          <h3>Attending an MCP Workshop?</h3>
          <p>Use promo code <code>WORKSHOP2024</code> for extended trial access</p>
        </div>
        <button class="banner-cta" on:click={navigateToSignup}>
          Sign Up Now
        </button>
      </div>
    </div>
  </section>

  <!-- How It Works Section -->
  <section class="how-it-works">
    <div class="container">
      <div class="section-header">
        <h2>How It Works</h2>
        <p class="section-subtitle">Get started in 3 simple steps</p>
      </div>

      <div class="steps-grid">
        <div class="step-card">
          <div class="step-number">1</div>
          <h3>Install CLI</h3>
          <div class="code-block">npm install -g mcp-bridge-cloud</div>
          <p>One-time setup, works on macOS, Linux, and Windows</p>
        </div>

        <div class="step-card">
          <div class="step-number">2</div>
          <h3>Connect Your Server</h3>
          <div class="code-block">mcp-bridge-cloud --api-key YOUR_KEY</div>
          <p>Start your local MCP server with cloud tunnel</p>
        </div>

        <div class="step-card">
          <div class="step-number">3</div>
          <h3>Add to ChatGPT</h3>
          <div class="code-block">https://yourname.mcp-bridge.xyz</div>
          <p>Configure once in ChatGPT custom actions - done!</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer CTA -->
  <section class="footer-cta">
    <div class="container">
      <h2>Ready to Stop Reconfiguring?</h2>
      <p>Join small business owners, researchers, and teams who trust MCP Bridge Cloud</p>
      <button class="cta-primary large" on:click={navigateToSignup}>
        Start Your Free Trial
      </button>
      <p class="footer-hint">14-day trial • No credit card required • Cancel anytime</p>
    </div>
  </section>
</div>

<style>
  /* Layout */
  .landing-page {
    min-height: 100vh;
    background-color: var(--bg-secondary);
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
  }

  /* Hero Section */
  .hero {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 4rem 0;
    text-align: center;
  }

  .hero-content {
    max-width: 800px;
    margin: 0 auto;
  }

  .hero-title {
    font-size: 3rem;
    font-weight: 700;
    margin-bottom: 1rem;
    line-height: 1.2;
  }

  .hero-subtitle {
    font-size: 1.25rem;
    margin-bottom: 2rem;
    opacity: 0.95;
    line-height: 1.6;
  }

  .hero-cta {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 1.5rem;
  }

  .cta-primary {
    padding: 1rem 2rem;
    font-size: 1.125rem;
    font-weight: 600;
    background-color: white;
    color: #667eea;
    border-radius: 0.5rem;
    border: none;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .cta-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  }

  .cta-primary.large {
    padding: 1.25rem 2.5rem;
    font-size: 1.25rem;
  }

  .cta-secondary {
    padding: 1rem 2rem;
    font-size: 1.125rem;
    font-weight: 600;
    background-color: rgba(255, 255, 255, 0.2);
    color: white;
    border: 2px solid white;
  }

  .cta-secondary:hover {
    background-color: rgba(255, 255, 255, 0.3);
  }

  .hero-hint {
    font-size: 0.875rem;
    opacity: 0.9;
  }

  .hero-hint code {
    background-color: rgba(255, 255, 255, 0.2);
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
  }

  /* Section Headers */
  section {
    padding: 4rem 0;
  }

  .section-header {
    text-align: center;
    margin-bottom: 3rem;
  }

  .section-header h2 {
    font-size: 2.5rem;
    color: var(--text);
    margin-bottom: 0.5rem;
  }

  .section-subtitle {
    font-size: 1.125rem;
    color: var(--text-secondary);
  }

  /* Problem/Solution Section */
  .comparison-grid {
    display: grid;
    gap: 2rem;
    grid-template-columns: 1fr;
  }

  .comparison-card {
    background-color: var(--bg);
    border-radius: 0.75rem;
    padding: 2rem;
    box-shadow: var(--shadow);
  }

  .comparison-card.highlight {
    border: 2px solid var(--primary);
    box-shadow: 0 10px 30px rgba(59, 130, 246, 0.15);
  }

  .comparison-badge {
    display: inline-block;
    padding: 0.5rem 1rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 600;
    margin-bottom: 1rem;
  }

  .comparison-badge.error {
    background-color: #fee2e2;
    color: #991b1b;
  }

  .comparison-badge.success {
    background-color: #d1fae5;
    color: #065f46;
  }

  .comparison-list {
    list-style: none;
    padding: 0;
    margin: 1rem 0 0 0;
  }

  .comparison-list li {
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--border);
    color: var(--text-secondary);
  }

  .comparison-list li:last-child {
    border-bottom: none;
  }

  .comparison-list li strong {
    color: var(--text);
  }

  /* Use Cases Section */
  .use-cases {
    background-color: var(--bg);
  }

  .use-cases-grid {
    display: grid;
    gap: 2rem;
    grid-template-columns: 1fr;
  }

  .use-case-card {
    position: relative;
  }

  .use-case-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .use-case-card h3 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
    color: var(--text);
  }

  .persona {
    font-size: 0.875rem;
    color: var(--primary);
    font-weight: 600;
    margin-bottom: 1.5rem;
  }

  .use-case-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .use-case-item strong {
    display: block;
    color: var(--text);
    margin-bottom: 0.25rem;
  }

  .use-case-item p {
    color: var(--text-secondary);
    margin: 0;
  }

  .use-case-item.benefit {
    background-color: #f0fdf4;
    padding: 1rem;
    border-radius: 0.5rem;
    border-left: 4px solid var(--success);
  }

  .use-case-item.benefit strong {
    color: var(--success);
  }

  /* Pricing Section */
  .pricing-grid {
    display: grid;
    gap: 2rem;
    grid-template-columns: 1fr;
    margin-bottom: 2rem;
  }

  .pricing-card {
    position: relative;
    text-align: center;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .pricing-card.highlighted {
    border: 2px solid var(--primary);
    transform: scale(1.05);
    box-shadow: 0 10px 30px rgba(59, 130, 246, 0.2);
  }

  .pricing-badge {
    position: absolute;
    top: -12px;
    right: 1rem;
    background-color: var(--primary);
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .tier-name {
    font-size: 1.5rem;
    color: var(--text);
    margin-bottom: 0.25rem;
  }

  .tier-target {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: 1.5rem;
  }

  .tier-price {
    margin-bottom: 2rem;
  }

  .tier-price .price {
    font-size: 3rem;
    font-weight: 700;
    color: var(--primary);
  }

  .tier-price .period {
    font-size: 1rem;
    color: var(--text-secondary);
  }

  .tier-features {
    list-style: none;
    padding: 0;
    margin: 0 0 2rem 0;
    text-align: left;
  }

  .tier-features li {
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--border);
    color: var(--text);
  }

  .tier-features li:last-child {
    border-bottom: none;
  }

  .tier-cta {
    width: 100%;
    padding: 0.75rem 1.5rem;
    font-weight: 600;
  }

  .pricing-note {
    text-align: center;
    color: var(--text-secondary);
    font-size: 0.875rem;
  }

  /* Workshop Banner */
  .workshop-banner {
    background: linear-gradient(90deg, #fef3c7 0%, #fed7aa 100%);
    padding: 2rem 0;
  }

  .banner-content {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    flex-wrap: wrap;
    justify-content: center;
    text-align: center;
  }

  .banner-icon {
    font-size: 3rem;
  }

  .banner-text h3 {
    margin-bottom: 0.25rem;
    color: #92400e;
  }

  .banner-text p {
    margin: 0;
    color: #78350f;
  }

  .banner-text code {
    background-color: rgba(255, 255, 255, 0.5);
    color: #92400e;
    font-weight: 600;
  }

  .banner-cta {
    background-color: #92400e;
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    border: none;
    font-weight: 600;
    cursor: pointer;
  }

  .banner-cta:hover {
    background-color: #78350f;
  }

  /* How It Works Section */
  .steps-grid {
    display: grid;
    gap: 2rem;
    grid-template-columns: 1fr;
  }

  .step-card {
    text-align: center;
  }

  .step-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    background-color: var(--primary);
    color: white;
    border-radius: 50%;
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
  }

  .step-card h3 {
    font-size: 1.25rem;
    margin-bottom: 1rem;
    color: var(--text);
  }

  .step-card p {
    color: var(--text-secondary);
    font-size: 0.875rem;
  }

  /* Footer CTA */
  .footer-cta {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    text-align: center;
    padding: 4rem 0;
  }

  .footer-cta h2 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    color: white;
  }

  .footer-cta p {
    font-size: 1.125rem;
    margin-bottom: 2rem;
    opacity: 0.95;
  }

  .footer-hint {
    font-size: 0.875rem;
    margin-top: 1rem;
    opacity: 0.9;
  }

  /* Responsive Design - Mobile First */
  @media (min-width: 640px) {
    .hero-title {
      font-size: 3.5rem;
    }

    .comparison-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .steps-grid {
      grid-template-columns: repeat(3, 1fr);
    }

    .banner-content {
      text-align: left;
      justify-content: space-between;
    }
  }

  @media (min-width: 768px) {
    .use-cases-grid {
      grid-template-columns: repeat(3, 1fr);
    }

    .pricing-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (min-width: 1024px) {
    .hero-title {
      font-size: 4rem;
    }

    section {
      padding: 5rem 0;
    }
  }
</style>

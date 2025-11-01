# Claude Code Extension Decision Tree

Quick reference for choosing the right extension type.

## Start Here: What Do You Want to Do?

```
┌─────────────────────────────────────────┐
│ What do you want to accomplish?         │
└─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
    Automate                Execute
    behavior               specific task
        │                       │
        ▼                       ▼
   [HOOKS]                  [Continue]
                                │
                    ┌───────────┴───────────┐
                    │                       │
              User invokes            Claude decides
                    │                       │
                    ▼                       ▼
            [SLASH COMMAND]         [SKILL or AGENT]
                                            │
                                    ┌───────┴───────┐
                                    │               │
                            Simple capability    Complex task
                            Auto-discovers      Isolated context
                                    │               │
                                    ▼               ▼
                                [SKILL]         [AGENT]
```

## Detailed Decision Flow

### 1. Do You Need Automation?

**Question**: Should this happen automatically without LLM decision?

✅ **YES → Use HOOKS**
- Auto-format code after edits
- Audit log all commands
- Block dangerous operations
- Run tests after changes
- Validate before git operations

❌ **NO → Continue to #2**

### 2. How Is It Invoked?

**Question**: Who triggers this?

#### Option A: User explicitly invokes
**→ Use SLASH COMMAND**

When to use:
- User types `/command-name`
- Quick prompt shortcuts
- Frequently used workflows
- Manual trigger desired

Examples:
- `/review` - Code review
- `/commit` - Create git commit
- `/deploy staging` - Deploy to staging
- `/test` - Generate tests

#### Option B: Claude decides when to use
**→ Continue to #3**

### 3. Complexity Level?

**Question**: How complex is the capability?

#### Option A: Simple, focused capability
**→ Use SKILL**

Characteristics:
- Single, well-defined capability
- Works within main context
- Auto-discovered based on description
- Lightweight

Examples:
- Excel analysis
- Code formatting
- Security scanning
- Documentation generation

#### Option B: Complex, specialized task
**→ Use AGENT**

Characteristics:
- Requires isolated context
- Multi-step process
- Specialized expertise
- Comprehensive workflow

Examples:
- Full code review
- Deployment orchestration
- Test suite generation
- Architecture design

### 4. Do You Need External Data?

**Question**: Does this need external services/data?

✅ **YES → Use MCP SERVER**
- Connect to databases
- Access APIs
- Integrate third-party services
- Query external systems

Examples:
- GitHub integration
- Database access
- Stripe payments
- Slack notifications

❌ **NO → Use tools above**

### 5. Do You Need to Package Multiple Extensions?

**Question**: Do you want to bundle and distribute extensions?

✅ **YES → Use PLUGIN**
- Package commands, skills, agents, hooks, MCP
- Distribute to team/marketplace
- Version and maintain together
- Install as single unit

❌ **NO → Create individual extensions**

## Quick Reference Matrix

| Scenario | Best Choice | Reason |
|----------|-------------|--------|
| "Auto-format code after I edit" | Hook | Automatic, deterministic |
| "I want a /review command" | Slash Command | User-invoked, explicit |
| "Help me analyze spreadsheets" | Skill | Auto-discovers, focused |
| "Need full PR review workflow" | Agent | Complex, isolated context |
| "Connect to GitHub API" | MCP Server | External integration |
| "Share our team's extensions" | Plugin | Bundle and distribute |

## Command vs Skill Decision

**Use SLASH COMMAND when:**
- ✅ Users will manually invoke by name
- ✅ Simple prompt expansion is sufficient
- ✅ Single markdown file is enough
- ✅ Manual control is desired
- ✅ Quick snippets/templates

**Use SKILL when:**
- ✅ Claude should auto-discover when relevant
- ✅ Need supporting files/documentation
- ✅ Context-aware invocation preferred
- ✅ Recurring capability needed
- ✅ Users might not know to invoke it

**Example**:
- User says: "Review this code"
  - ❌ Slash Command: User would have to remember `/review`
  - ✅ Skill: Auto-activates because description matches "code review"

## Skill vs Agent Decision

**Use SKILL when:**
- ✅ Simple, focused capability
- ✅ Works fine in main context
- ✅ Quick invocation needed
- ✅ Minimal tool restrictions

**Use AGENT when:**
- ✅ Complex multi-step workflow
- ✅ Needs isolated context
- ✅ Specialized system prompt required
- ✅ Tool restrictions important
- ✅ Comprehensive task

**Example**:
- "Check this file for security issues"
  - ✅ Skill: Quick scan, focused task
- "Perform full security audit of the entire application"
  - ✅ Agent: Complex, needs isolation

## Hook vs Everything Else

**Use HOOKS when:**
- ✅ Must happen automatically
- ✅ Can't rely on LLM decision
- ✅ Deterministic behavior required
- ✅ Safety/compliance critical
- ✅ Event-driven automation

**Don't use HOOKS when:**
- ❌ LLM should decide when to act
- ❌ Flexible behavior desired
- ❌ Context-dependent decisions needed

## Real-World Examples

### Example 1: Code Review

**Requirement**: "I want code review functionality"

**Decision Path**:
1. Automation? No, needs intelligent analysis
2. Invocation? Could be manual OR automatic
3. Complexity? High - full review process

**Options**:
- **Slash Command** `/review` - If users want explicit control
- **Skill** `code-reviewer` - If should auto-activate on "review my code"
- **Agent** `code-reviewer` - Best choice for comprehensive reviews

**Recommendation**: **Agent** (comprehensive, isolated context)

### Example 2: Auto-Format

**Requirement**: "Format code after every edit"

**Decision Path**:
1. Automation? YES - always happens

**Recommendation**: **Hook** (PostToolUse on Edit|Write)

### Example 3: GitHub Integration

**Requirement**: "Access GitHub issues and PRs"

**Decision Path**:
1. External data? YES - GitHub API

**Recommendation**: **MCP Server** (github mcp-server)

Then add:
- **Slash Command** `/create-issue` for manual use
- **Skill** for auto-discovering when to create issues
- **Agent** for complex GitHub workflows

### Example 4: Team Workflow Package

**Requirement**: "Share our development workflow with the team"

**Components**:
- `/deploy` command
- Auto-format hook
- Code review agent
- Testing skill
- GitHub MCP integration

**Recommendation**: **Plugin** (bundles all components)

## Common Patterns

### Pattern 1: Progressive Enhancement

Start simple, add complexity as needed:

1. **Start**: Slash Command `/review`
2. **Enhance**: Add Skill for auto-discovery
3. **Specialize**: Create Agent for complex reviews
4. **Automate**: Add Hook to block PRs without review
5. **Package**: Bundle as Plugin

### Pattern 2: Layered Security

Combine hooks with other extensions:

1. **Hook**: Validate permissions (PreToolUse)
2. **Command**: Execute operation
3. **Hook**: Audit log (PostToolUse)

### Pattern 3: External Integration

MCP + Extensions:

1. **MCP Server**: Connect to service
2. **Slash Commands**: Manual operations
3. **Skills**: Auto-discover when to use
4. **Agents**: Orchestrate complex workflows

## Anti-Patterns (Avoid These)

### ❌ Using Slash Command for Auto-Discovery
**Wrong**: Complex prompt in slash command, hoping Claude will use it
**Right**: Use Skill with good description for auto-discovery

### ❌ Using Skill for Complex Workflows
**Wrong**: Putting entire deployment workflow in a skill
**Right**: Use Agent with isolated context and comprehensive instructions

### ❌ Using Agent for Simple Tasks
**Wrong**: Creating agent for "format this code"
**Right**: Use Hook (auto) or Slash Command (manual)

### ❌ Using Hooks for LLM Decisions
**Wrong**: Hook tries to decide if code is "good enough"
**Right**: Hook enforces rules, Agent makes judgment calls

## Decision Tree Shortcut

Quick questions to ask:

1. **Automatic?** → Hook
2. **User types /command?** → Slash Command
3. **External service?** → MCP Server
4. **Simple auto-discovery?** → Skill
5. **Complex task?** → Agent
6. **Multiple extensions?** → Plugin

## Still Not Sure?

### Start Here:
1. Create a **Slash Command** first (easiest)
2. Test it manually
3. If it should auto-activate → convert to **Skill**
4. If it's too complex → upgrade to **Agent**
5. If you need automation → add **Hooks**
6. If you need external data → add **MCP**
7. If you want to share → package as **Plugin**

### Get Help:
Ask Claude Code: "Should I use a skill or an agent for [your use case]?"

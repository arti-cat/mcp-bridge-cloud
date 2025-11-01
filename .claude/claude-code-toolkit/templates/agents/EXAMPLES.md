# Sub-Agent Examples

Practical sub-agent templates for common workflows.

## Quick Reference

| Agent Type | Use Case | Tools | Model |
|------------|----------|-------|-------|
| code-reviewer | PR reviews, code audits | Read, Grep, Glob, Git | Sonnet |
| testing-specialist | Test generation, coverage | Read, Write, Edit, npm | Sonnet |
| deployment-specialist | Deploy to environments | Bash, Git, Docker | Sonnet |
| debugging-expert | Fix bugs, investigate issues | All tools | Sonnet |
| refactoring-expert | Code improvements | Read, Write, Edit | Sonnet |
| documentation-expert | Generate docs | Read, Write | Sonnet |
| security-auditor | Security reviews | Read, Grep, Glob | Sonnet |
| performance-optimizer | Performance improvements | Read, Grep, npm | Sonnet |

## Usage Patterns

### Explicit Invocation
```
@code-reviewer Please review my recent changes
@testing-specialist Generate tests for the auth module
@deployment-specialist Deploy to staging
```

### Automatic Delegation
Claude will automatically delegate to appropriate agents based on:
- Agent description matching user request
- Task complexity requiring isolated context
- Specialized expertise needed

## Creating Custom Agents

### Template Selection

**Analysis/Review (Read-Only)**:
```yaml
tools: Read, Grep, Glob, Bash(git diff:*)
```

**Code Generation**:
```yaml
tools: Read, Write, Edit, Grep, Glob
```

**Full Development**:
```yaml
tools: Read, Write, Edit, Grep, Glob, Bash(npm *:*), Bash(git *:*)
```

**Deployment/Operations**:
```yaml
tools: Read, Bash(*:*), Grep
```

### Agent Naming

**Good names** (descriptive, specific):
- `api-endpoint-generator`
- `database-migration-specialist`
- `react-component-creator`
- `docker-deployment-expert`

**Bad names** (vague, generic):
- `helper`
- `agent`
- `assistant`
- `worker`

### Description Writing

**Good descriptions** (specific, keyword-rich):
```yaml
description: Generate React components with TypeScript, props interface, tests, and storybook stories. Use for creating new React components or converting class components to functional components.
```

**Bad descriptions** (vague):
```yaml
description: Helps with React stuff
```

## Advanced Agent Patterns

### Chained Agents

Agents can work in sequence:
1. `code-generator` creates code
2. `code-reviewer` reviews it
3. `testing-specialist` adds tests
4. `documentation-expert` documents it

### Specialized Domain Agents

**Frontend Specialist**:
```yaml
---
name: frontend-specialist
description: React, Vue, Angular development with focus on components, state management, and styling
tools: Read, Write, Edit, Grep, Glob, Bash(npm *:*)
model: sonnet
---
```

**Backend Specialist**:
```yaml
---
name: backend-specialist
description: API development, database design, authentication, and server-side logic
tools: Read, Write, Edit, Grep, Bash(npm *:*), Bash(docker *:*)
model: sonnet
---
```

**DevOps Specialist**:
```yaml
---
name: devops-specialist
description: CI/CD, containerization, infrastructure as code, and deployment automation
tools: Read, Write, Bash(*:*), Grep
model: sonnet
---
```

### Project-Specific Agents

**Company Style Agent**:
```yaml
---
name: company-style-enforcer
description: Ensure code follows company coding standards and style guide
tools: Read, Edit, Grep, Glob, Bash(npm run lint:*)
---

Enforce company coding standards:

## Style Rules
- Use 2-space indentation
- Prefer const over let
- Use TypeScript strict mode
- Follow functional programming patterns
- Comprehensive JSDoc comments

## Architecture Rules
- Use dependency injection
- Follow clean architecture
- Separate business logic from UI
- Use repository pattern for data access

[Reference company style guide]
```

**Legacy Modernization Agent**:
```yaml
---
name: legacy-modernizer
description: Modernize legacy code to current standards while maintaining compatibility
tools: Read, Write, Edit, Grep, Glob
---

Modernize legacy code:

1. Identify legacy patterns
2. Plan migration strategy
3. Update incrementally
4. Maintain backward compatibility
5. Add tests for safety
6. Document changes

Common migrations:
- Class components → Hooks
- Callbacks → Promises/Async-await
- CommonJS → ES Modules
- JavaScript → TypeScript
```

## Agent Best Practices

### 1. Single Responsibility
Each agent should have one clear purpose:
✅ Good: `api-documentation-generator`
❌ Bad: `general-purpose-helper`

### 2. Clear Tool Boundaries
Restrict tools to what's needed:
```yaml
# Review agent doesn't need Write
tools: Read, Grep, Glob

# Generator agent needs Write but not Bash
tools: Read, Write, Edit, Grep
```

### 3. Comprehensive Instructions
Include:
- Clear purpose
- Step-by-step process
- Examples
- Success criteria
- Common pitfalls

### 4. Model Selection
- **Sonnet**: Default, balanced performance
- **Opus**: Complex reasoning, critical tasks
- **Haiku**: Simple, fast tasks
- **'inherit'**: Use conversation model

### 5. Testing Agents
Test your agents:
1. Create agent
2. Invoke explicitly
3. Verify behavior
4. Refine instructions
5. Share with team

## Troubleshooting

### Agent Not Activating
**Problem**: Agent doesn't activate automatically
**Solution**: Improve description with specific keywords

**Before**:
```yaml
description: Helps with databases
```

**After**:
```yaml
description: Optimize SQL queries, fix N+1 problems, suggest indexes. Use for database performance, slow queries, PostgreSQL, MySQL optimization.
```

### Agent Using Wrong Tools
**Problem**: Agent attempts restricted operations
**Solution**: Explicit tool restrictions

```yaml
# Add allowed-tools to limit access
tools: Read, Grep, Glob
```

### Agent Context Issues
**Problem**: Agent needs info from main conversation
**Solution**: Provide context in invocation

```
@agent-name Based on the code we just reviewed, please optimize the database queries
```

## Agent Management

### Organization
```
.claude/agents/
├── code-quality/
│   ├── reviewer.md
│   ├── refactorer.md
│   └── linter.md
├── testing/
│   ├── unit-tester.md
│   └── e2e-tester.md
└── deployment/
    ├── staging-deployer.md
    └── production-deployer.md
```

### Version Control
- Commit agents to git for team sharing
- Document agent purpose in README
- Version agent instructions when changing behavior
- Review agent changes in PRs

### Documentation
Create `AGENTS.md` in your project:
```markdown
# Project Agents

## code-reviewer
**Purpose**: Review pull requests
**Usage**: `@code-reviewer Check this PR`
**Tools**: Read, Grep, Git

## deployment-specialist
**Purpose**: Deploy to environments
**Usage**: `@deployment-specialist Deploy to staging`
**Tools**: Bash, Git, Docker

[... document all agents]
```

## Success Metrics

A good agent should:
- ✅ Activate when appropriate
- ✅ Complete tasks successfully
- ✅ Provide consistent results
- ✅ Save time vs manual approach
- ✅ Be reusable across tasks
- ✅ Be understood by team members

## Remember

- Agents work in isolated context
- Agents don't see main conversation unless told
- Agents can use other agents (careful with nesting)
- Agents are reusable across projects
- Good agents save time and ensure consistency

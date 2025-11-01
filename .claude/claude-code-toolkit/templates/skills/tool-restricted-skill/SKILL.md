---
name: tool-restricted-skill
description: Skill with restricted tool access for security-sensitive operations. Use when skill should only have read-only access or specific tool permissions.
allowed-tools: Read, Grep, Glob
---

# Tool-Restricted Skill

This skill demonstrates how to restrict tool access for security and safety.

## Tool Restriction Purpose

The `allowed-tools` field limits which tools this skill can use when activated.
This is useful for:
- **Read-only operations**: Prevent accidental modifications
- **Security-sensitive workflows**: Limit potentially dangerous operations
- **Focused capabilities**: Ensure skill stays within its scope
- **Safety**: Prevent unintended side effects

## Allowed Tools for This Skill

This skill is restricted to:
- **Read**: Read file contents
- **Grep**: Search for patterns in files
- **Glob**: Find files by pattern

This skill **cannot** use:
- Write, Edit, NotebookEdit (file modifications)
- Bash (command execution)
- WebFetch, WebSearch (network access)
- Task (sub-agent delegation)

## When to Use Tool Restrictions

### Use Cases for Restricted Tools

1. **Analysis-only skills**:
   ```yaml
   allowed-tools: Read, Grep, Glob
   ```
   Example: Code analysis, documentation review, search functionality

2. **Safe git operations**:
   ```yaml
   allowed-tools: Bash(git status:*), Bash(git log:*), Bash(git diff:*), Read
   ```
   Example: Git status reporting, commit history analysis (no modifications)

3. **Read and report**:
   ```yaml
   allowed-tools: Read, Grep
   ```
   Example: Security audits, dependency checks (no changes)

4. **Build status checking**:
   ```yaml
   allowed-tools: Bash(npm test:*), Bash(npm run lint:*), Read
   ```
   Example: CI/CD status checks (no deployments)

## Tool Permission Syntax

### Basic Tools (No Arguments)
```yaml
allowed-tools: Read, Write, Edit, Grep, Glob
```

### Bash with Wildcards
```yaml
allowed-tools: Bash(git *:*), Bash(npm test:*)
```
- `Bash(git *:*)` - All git commands
- `Bash(npm test:*)` - Only npm test commands
- Use wildcards (`*`) for flexible matching

### Multiple Tools
```yaml
allowed-tools: Read, Grep, Bash(git status:*), Bash(git diff:*)
```
Comma-separated list of allowed tools

### No Restrictions
Omit the `allowed-tools` field entirely to inherit all tools from conversation.

## Skill Instructions

[Your skill instructions here]

When this skill activates, it can only:
1. Read files to understand code
2. Search for patterns using Grep
3. Find files using Glob patterns

It cannot modify files, run arbitrary commands, or access the network.

## Safety Benefits

1. **Predictable behavior**: Limited tools = limited side effects
2. **Security**: Can't accidentally run destructive commands
3. **Trust**: Team members can trust read-only skills
4. **Focus**: Tool restrictions enforce skill boundaries

## Example: Code Analysis Skill

```yaml
---
name: security-analyzer
description: Analyze code for security vulnerabilities without making changes
allowed-tools: Read, Grep, Glob
---

Analyze the codebase for security issues:
1. Search for common vulnerability patterns
2. Check for hardcoded secrets
3. Verify input validation
4. Review authentication logic

Report findings with:
- File and line number
- Description of issue
- Severity level
- Recommended fix

This skill is read-only - it will not modify any files.
```

## When NOT to Restrict Tools

Don't use `allowed-tools` when:
- Skill needs flexibility to handle varied tasks
- User explicitly requests modifications
- Skill is for general-purpose assistance
- Tool needs are unpredictable

## Testing Tool Restrictions

To verify tool restrictions work:
1. Activate the skill
2. Try to use a restricted tool
3. Should see error or permission denial
4. Confirm only allowed tools work

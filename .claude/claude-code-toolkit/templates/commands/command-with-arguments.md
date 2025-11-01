---
argument-hint: <required-arg> [optional-arg]
description: Example command that processes arguments
---

# Command with Arguments Template

## How to Use Arguments

When users invoke this command like:
```
/command-name first-value second-value third-value
```

Access them with:
- `$ARGUMENTS` = "first-value second-value third-value" (all together)
- `$1` = "first-value"
- `$2` = "second-value"
- `$3` = "third-value"

## Example: Git Commit Command

```markdown
---
allowed-tools: Bash(git add:*), Bash(git commit:*), Bash(git status:*)
argument-hint: <commit-message>
description: Create a git commit with provided message
---

Create a git commit with the following message: $ARGUMENTS

Steps:
1. Run git status to see changes
2. Add relevant files to staging
3. Create commit with proper formatting
4. Follow conventional commits format (feat:, fix:, docs:, etc.)
```

## Example: PR Review Command

```markdown
---
argument-hint: <pr-number> [priority]
description: Review pull request with optional priority
---

Review PR #$1 with priority level: ${2:-normal}

Tasks:
- Fetch PR details
- Review code changes
- Check for security issues
- Verify tests pass
- Priority: $2 (if not provided, use "normal")
```

## Example: Deploy Command

```markdown
---
argument-hint: <environment> <version>
description: Deploy specific version to environment
---

Deploy version $2 to $1 environment

Pre-deployment checks:
- Verify environment: $1 (must be staging/production)
- Verify version format: $2 (must be semver)
- Run tests before deployment
- Create deployment backup
```

## Handling Missing Arguments

Use shell-style defaults:
- `${1:-default}` - Use $1 if provided, otherwise "default"
- `$ARGUMENTS` - Always contains something (empty string if no args)

## Validation Pattern

```markdown
Validate inputs:
1. Check $1 is not empty: ${1:?Error: First argument required}
2. Check $2 matches pattern
3. Proceed with validated arguments
```

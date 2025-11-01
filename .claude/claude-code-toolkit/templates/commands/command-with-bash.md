---
allowed-tools: Bash(git *:*), Bash(npm *:*), Read
description: Command that executes bash commands inline
---

# Command with Bash Execution Template

## Using Inline Bash with ! Prefix

Commands prefixed with `!` execute BEFORE the prompt is processed.
The output is inserted into the prompt text.

## Syntax
```
!`command here`
```

## Examples

### Git Information Command
```markdown
---
allowed-tools: Bash(git status:*), Bash(git log:*), Bash(git branch:*)
description: Show comprehensive git repository status
---

# Current Repository Status

**Branch**: !`git branch --show-current`

**Status**:
!`git status --short`

**Recent Commits**:
!`git log --oneline -10`

**Uncommitted Changes**:
!`git diff --stat`

Based on the above information, analyze the repository state and suggest next actions.
```

### Build Status Command
```markdown
---
allowed-tools: Bash(npm *:*), Bash(cat package.json:*)
description: Check project build status and dependencies
---

# Project Status

**Package Name**: !`cat package.json | jq -r '.name'`
**Version**: !`cat package.json | jq -r '.version'`

**Available Scripts**:
!`cat package.json | jq -r '.scripts | keys[]'`

**Dependency Count**: !`cat package.json | jq '.dependencies | length'`

**Last Build**: !`ls -lh dist/ 2>/dev/null | head -5 || echo "No build found"`

Analyze the project configuration and suggest improvements.
```

### Test Coverage Command
```markdown
---
allowed-tools: Bash(npm test:*), Bash(cat coverage/**:*)
description: Show test coverage and identify gaps
---

# Test Coverage Report

**Running tests**:
!`npm test -- --coverage --silent 2>&1 | tail -20`

**Coverage Summary**:
!`cat coverage/coverage-summary.json 2>/dev/null | jq '.total' || echo "No coverage data"`

**Uncovered Files**:
!`find src -name "*.test.ts" -o -name "*.spec.ts" | wc -l` test files found

Based on this coverage data, identify areas that need more tests.
```

## Important Notes

1. **Security**: Only use with trusted commands - bash execution is powerful
2. **Allowed-tools**: Must explicitly allow the bash commands you want to run
3. **Error Handling**: Commands that fail will show error output
4. **Quoting**: Use proper shell quoting for complex commands
5. **Wildcards**: `Bash(git *:*)` allows all git commands

## Pattern: Conditional Execution

```markdown
**Git Status**: !`git status >/dev/null 2>&1 && git status || echo "Not a git repository"`
```

## Pattern: Combining Multiple Commands

```markdown
**System Info**:
- OS: !`uname -s`
- Node: !`node --version`
- NPM: !`npm --version`
- Git: !`git --version`
```

## Pattern: JSON Parsing

```markdown
**Package Details**:
!`cat package.json | jq -r '"Name: \(.name)\nVersion: \(.version)\nLicense: \(.license)"'`
```

## When to Use Bash Execution

✅ **Good use cases:**
- Reading git information
- Checking build status
- Analyzing file statistics
- Reading configuration files
- Getting system information

❌ **Avoid for:**
- Modifying files (use Edit/Write tools instead)
- Long-running commands
- Interactive commands
- Commands requiring user input
- Destructive operations

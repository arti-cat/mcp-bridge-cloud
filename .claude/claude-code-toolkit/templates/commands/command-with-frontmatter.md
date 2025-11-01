---
allowed-tools: Bash(git status:*), Bash(git diff:*), Read, Grep
argument-hint: [optional-arg]
description: Brief description of what this command does (important for SlashCommand tool)
model: sonnet
disable-model-invocation: false
---

# Command Instructions

Your detailed instructions go here.

## Frontmatter Fields Explained

- **allowed-tools**: Comma-separated list of tools this command can use
  - Examples: `Bash(npm test:*)`, `Read`, `Write`, `Edit`, `Grep`, `Glob`
  - Supports wildcards: `Bash(git *:*)`
  - Omit to inherit from conversation

- **argument-hint**: Shows in autocomplete to guide users
  - Example: `[message]`, `[file-path]`, `[pr-number priority]`

- **description**: Critical for SlashCommand tool discovery
  - Keep concise (1-2 sentences)
  - Describe WHAT it does and WHEN to use it

- **model**: Override model for this command
  - Options: `sonnet`, `opus`, `haiku`, or specific model IDs
  - Omit to inherit from conversation

- **disable-model-invocation**: Prevent SlashCommand tool from using this
  - Set to `true` if command should only be manually invoked
  - Default: `false`

## Using Arguments

Access arguments in your instructions:
- `$ARGUMENTS` - All arguments as single string
- `$1`, `$2`, `$3` - Individual positional arguments

Example:
```
Process the PR number $1 with priority $2 and assign to $3
```

## Using Bash Execution

Prefix commands with `!` to execute before prompt processing:

```
Current git status: !`git status`
Recent commits: !`git log --oneline -5`
```

## Using File References

Use `@` prefix to include file contents:

```
Review the implementation in @src/main.ts
Compare @old-version.js with @new-version.js
```

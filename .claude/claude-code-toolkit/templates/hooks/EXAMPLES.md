# Hook Configuration Examples

Practical hook configurations for common automation needs.

## Hook Event Types

1. **PreToolUse** - Before tool execution (can block)
2. **PostToolUse** - After tool execution (can validate/block)
3. **UserPromptSubmit** - When user submits prompt
4. **Stop** - When Claude finishes responding
5. **SubagentStop** - When subagent completes
6. **SessionStart** - Session begins (matchers: startup, resume, clear, compact)
7. **SessionEnd** - Session ends
8. **Notification** - Notifications occur
9. **PreCompact** - Before context compaction

## Common Use Cases

### 1. Auto-Format Code After Edits

**Use Case**: Automatically format files after Edit or Write

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "prettier --write \"$TOOL_INPUT_file_path\" 2>/dev/null || true",
            "timeout": 10000
          }
        ]
      }
    ]
  }
}
```

### 2. Audit Log All Commands

**Use Case**: Log all bash commands for security auditing

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "echo \"[$(date)] $TOOL_INPUT\" | jq -r '.command' >> ~/.claude/audit.log"
          }
        ]
      }
    ]
  }
}
```

### 3. Prevent Production File Edits

**Use Case**: Block edits to production files

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'if [[ \"$TOOL_INPUT_file_path\" =~ ^/production/ ]]; then echo \"Cannot modify production files\" >&2; exit 2; fi'"
          }
        ]
      }
    ]
  }
}
```

### 4. Run Tests After File Changes

**Use Case**: Auto-run relevant tests after code changes

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'file=\"$TOOL_INPUT_file_path\"; if [[ \"$file\" =~ \\.ts$ ]] && [[ -f \"${file%.ts}.test.ts\" ]]; then npm test \"${file%.ts}.test.ts\"; fi'",
            "timeout": 30000
          }
        ]
      }
    ]
  }
}
```

### 5. Lint Before Git Operations

**Use Case**: Ensure code is linted before commits/pushes

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'cmd=$(echo \"$TOOL_INPUT\" | jq -r \".command\"); if [[ \"$cmd\" =~ git\\ (commit|push) ]]; then npm run lint || exit 2; fi'"
          }
        ]
      }
    ]
  }
}
```

### 6. Backup Before Destructive Operations

**Use Case**: Create backup before file deletions

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'cmd=$(echo \"$TOOL_INPUT\" | jq -r \".command\"); if [[ \"$cmd\" =~ rm\\ .*-r ]]; then echo \"Creating backup...\"; tar -czf backup-$(date +%s).tar.gz .; fi'"
          }
        ]
      }
    ]
  }
}
```

### 7. Notify Team on Deployment

**Use Case**: Send Slack notification after deployment

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'cmd=$(echo \"$TOOL_INPUT\" | jq -r \".command\"); if [[ \"$cmd\" =~ deploy ]]; then curl -X POST $SLACK_WEBHOOK -d \"{\\\"text\\\":\\\"Deployment completed\\\"}\"; fi'"
          }
        ]
      }
    ]
  }
}
```

### 8. Environment Variable Validation

**Use Case**: Check required env vars exist before npm scripts

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'cmd=$(echo \"$TOOL_INPUT\" | jq -r \".command\"); if [[ \"$cmd\" =~ npm\\ run ]]; then for var in API_KEY DB_URL; do [ -z \"${!var}\" ] && echo \"$var not set\" >&2 && exit 2; done; fi'"
          }
        ]
      }
    ]
  }
}
```

### 9. Session Initialization

**Use Case**: Set up project context on session start

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'echo \"Project: $(cat package.json | jq -r .name)\" > $CLAUDE_ENV_FILE; echo \"Initialized session for project\"'"
          }
        ]
      }
    ]
  }
}
```

### 10. MCP Tool Validation

**Use Case**: Validate parameters before MCP tool execution

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "mcp__github__.*",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'if [ -z \"$GITHUB_TOKEN\" ]; then echo \"GITHUB_TOKEN not configured\" >&2; exit 2; fi'"
          }
        ]
      }
    ]
  }
}
```

## Advanced Patterns

### JSON Output for Complex Logic

**Use Case**: Complex decision-making with detailed feedback

```bash
#!/bin/bash
# save as ~/.claude/hooks/validate-edit.sh

file_path="$TOOL_INPUT_file_path"

# Check if sensitive file
if [[ "$file_path" =~ \.env|credentials|secrets ]]; then
  cat <<EOF
{
  "continue": false,
  "stopReason": "Attempted to edit sensitive file",
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Editing $file_path is not allowed. Contains sensitive information."
  }
}
EOF
  exit 0
fi

# Allow with warning for production files
if [[ "$file_path" =~ ^production/ ]]; then
  cat <<EOF
{
  "continue": true,
  "systemMessage": "⚠️ Warning: Editing production file $file_path. Proceed with caution.",
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "ask",
    "permissionDecisionReason": "Production file - requires confirmation"
  }
}
EOF
  exit 0
fi

# Allow normally
echo '{"continue": true}'
```

**Hook configuration**:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/validate-edit.sh"
          }
        ]
      }
    ]
  }
}
```

### PostToolUse Validation

**Use Case**: Validate file changes and provide feedback

```bash
#!/bin/bash
# save as ~/.claude/hooks/validate-changes.sh

file_path="$TOOL_INPUT_file_path"

# Run linter
if [[ "$file_path" =~ \.(ts|js)$ ]]; then
  if ! eslint "$file_path" 2>&1; then
    cat <<EOF
{
  "decision": "block",
  "reason": "ESLint errors found in $file_path",
  "hookSpecificOutput": {
    "additionalContext": "Please fix linting errors before proceeding"
  }
}
EOF
    exit 0
  fi
fi

# Success
cat <<EOF
{
  "continue": true,
  "hookSpecificOutput": {
    "additionalContext": "File $file_path validated successfully"
  }
}
EOF
```

### Conditional Hook Execution

**Use Case**: Different hooks for different file types

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'file=\"$TOOL_INPUT_file_path\"; case \"$file\" in *.ts|*.js) prettier --write \"$file\" && eslint --fix \"$file\";; *.py) black \"$file\";; *.go) gofmt -w \"$file\";; esac'"
          }
        ]
      }
    ]
  }
}
```

## Hook Matchers

### Tool Matchers (PreToolUse & PostToolUse)

```json
{
  "matcher": "*"                    // All tools
  "matcher": "Bash"                 // Only Bash
  "matcher": "Edit|Write"           // Edit OR Write
  "matcher": "Read|Grep|Glob"       // Any read operations
  "matcher": "Notebook.*"           // Any Notebook tool
  "matcher": "mcp__.*"              // Any MCP tool
  "matcher": "mcp__github__.*"      // GitHub MCP tools
}
```

### Session Matchers (SessionStart only)

```json
{
  "matcher": "startup"   // Fresh session start
  "matcher": "resume"    // Resume existing session
  "matcher": "clear"     // After /clear command
  "matcher": "compact"   // After context compaction
}
```

## Environment Variables

Available in all hooks:

- `$CLAUDE_PROJECT_DIR` - Project root directory
- `$CLAUDE_CODE_REMOTE` - "true" if web, "false" if local
- `$CLAUDE_ENV_FILE` - File to persist env vars (SessionStart only)
- `$CLAUDE_PLUGIN_ROOT` - Plugin directory (plugin hooks only)
- `$TOOL_INPUT` - Complete tool input as JSON
- `$TOOL_INPUT_<field>` - Specific tool input fields (e.g., `$TOOL_INPUT_file_path`)

## Exit Codes

- **0** - Success, output shown to user
- **2** - Blocking error, stderr to Claude
- **Other** - Non-blocking error, stderr to user

## Security Best Practices

### 1. Validate All Inputs
```bash
# Always quote variables
file="$TOOL_INPUT_file_path"

# Check for path traversal
if [[ "$file" =~ \.\. ]]; then
  echo "Path traversal detected" >&2
  exit 2
fi
```

### 2. Use Absolute Paths
```bash
# Use CLAUDE_PROJECT_DIR
file="$CLAUDE_PROJECT_DIR/$TOOL_INPUT_file_path"
```

### 3. Sanitize Before Logging
```bash
# Don't log sensitive data
cmd=$(echo "$TOOL_INPUT" | jq -r '.command' | sed 's/password=[^ ]*/password=***/g')
echo "$cmd" >> audit.log
```

### 4. Fail Safely
```bash
# Use || true for non-critical operations
prettier --write "$file" 2>/dev/null || true

# But fail hard for security checks
check_permissions "$file" || exit 2
```

## Testing Hooks

### Test Hook Script Directly
```bash
# Export test data
export TOOL_INPUT='{"file_path": "test.ts"}'
export TOOL_INPUT_file_path="test.ts"
export CLAUDE_PROJECT_DIR="/path/to/project"

# Run hook script
bash ~/.claude/hooks/my-hook.sh
```

### Test in Claude Code
1. Add hook to settings.json
2. Trigger the hook event
3. Check output/behavior
4. Verify exit codes work correctly

## Debugging Hooks

### Add Debug Output
```bash
# Add at start of hook script
echo "DEBUG: Hook triggered" >&2
echo "DEBUG: File: $TOOL_INPUT_file_path" >&2
```

### Log Hook Execution
```bash
# Add logging
{
  echo "[$(date)] Hook: $0"
  echo "[$(date)] Input: $TOOL_INPUT"
} >> ~/.claude/hook-debug.log
```

### Check Hook Registration
Use `/hooks` command in Claude Code to see registered hooks.

## Performance Tips

1. **Keep hooks fast** - Hooks block execution
2. **Use timeouts** - Prevent hanging (default 120s)
3. **Run async when possible** - Background non-critical tasks
4. **Cache results** - Don't repeat expensive operations
5. **Filter early** - Check conditions before expensive ops

## Remember

- Hooks execute automatically - test thoroughly
- Hooks run with your permissions - be security-conscious
- Hook errors can block operations - handle failures gracefully
- Use exit code 2 to block operations
- Hooks are powerful - use responsibly

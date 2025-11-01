#!/bin/bash

# Claude Code Extension Generator
# Simple helper script to create extensions from templates

set -e

TOOLKIT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATES_DIR="$TOOLKIT_DIR/templates"

show_help() {
    cat << EOF
Claude Code Extension Generator

Usage: ./generator.sh <type> <name> [destination]

Types:
  command      Create a slash command
  skill        Create a skill
  agent        Create a sub-agent
  hooks        Create hooks configuration
  mcp          Create MCP server config
  plugin       Create plugin structure

Examples:
  ./generator.sh command review ~/.claude/commands/review.md
  ./generator.sh skill analyzer ~/.claude/skills/analyzer
  ./generator.sh agent tester ~/.claude/agents/tester.md

Without destination, creates in current directory.
EOF
}

create_command() {
    local name="$1"
    local dest="${2:-./.claude/commands/${name}.md}"

    echo "Creating slash command: $name"
    mkdir -p "$(dirname "$dest")"

    cat > "$dest" << 'EOF'
---
description: Brief description of what this command does
---

# Command Instructions

Your command instructions go here.

## Usage
/command-name [arguments]

## What This Does

Describe the purpose and behavior of this command.
EOF

    echo "✓ Created: $dest"
    echo "Edit the file and customize it for your needs."
    echo "Usage: /$name"
}

create_skill() {
    local name="$1"
    local dest="${2:-./.claude/skills/${name}}"

    echo "Creating skill: $name"
    mkdir -p "$dest"

    cat > "$dest/SKILL.md" << 'EOF'
---
name: skill-name
description: Clear description of what this skill does and when to use it. Include trigger keywords!
---

# Skill Instructions

Your skill instructions go here.

## What This Skill Does

Describe the capability this skill provides.

## When to Use

This skill activates when users need [describe scenarios].

## Process

1. Step one
2. Step two
3. Step three
EOF

    echo "✓ Created: $dest/SKILL.md"
    echo "Edit the SKILL.md file and update the name and description."
    echo "Claude will auto-discover this skill when the description matches."
}

create_agent() {
    local name="$1"
    local dest="${2:-./.claude/agents/${name}.md}"

    echo "Creating sub-agent: $name"
    mkdir -p "$(dirname "$dest")"

    cat > "$dest" << 'EOF'
---
name: agent-name
description: Natural language description of what this agent does and when to use it
tools: Read, Write, Edit, Grep, Glob
model: sonnet
---

# Agent System Prompt

Your agent's system prompt goes here.

## Purpose

Describe what this agent specializes in.

## Guidelines

- Guideline 1
- Guideline 2
- Guideline 3

## Process

1. Step one
2. Step two
3. Step three
EOF

    echo "✓ Created: $dest"
    echo "Edit the file and customize the system prompt."
    echo "Usage: @$name <task description>"
}

create_hooks() {
    local dest="${1:-./.claude/settings.json}"

    echo "Creating hooks configuration"

    if [ -f "$dest" ]; then
        echo "⚠ Warning: $dest already exists"
        echo "Please add hooks configuration manually to avoid overwriting."
        echo "See: $TEMPLATES_DIR/hooks/EXAMPLES.md"
        exit 1
    fi

    mkdir -p "$(dirname "$dest")"

    cat > "$dest" << 'EOF'
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'File modified: $TOOL_INPUT_file_path'"
          }
        ]
      }
    ]
  }
}
EOF

    echo "✓ Created: $dest"
    echo "Edit the file to add your hook configurations."
    echo "See examples: $TEMPLATES_DIR/hooks/EXAMPLES.md"
}

create_mcp() {
    local dest="${1:-./.mcp.json}"

    echo "Creating MCP server configuration"

    if [ -f "$dest" ]; then
        echo "⚠ Warning: $dest already exists"
        echo "Please add MCP servers manually to avoid overwriting."
        exit 1
    fi

    cat > "$dest" << 'EOF'
{
  "mcpServers": {
    "my-server": {
      "transport": "stdio",
      "command": "/path/to/mcp-server",
      "args": [],
      "env": {
        "API_KEY": "${API_KEY}"
      }
    }
  }
}
EOF

    echo "✓ Created: $dest"
    echo "Edit the file to configure your MCP servers."
    echo "See: claude mcp add --help"
}

create_plugin() {
    local name="$1"
    local dest="${2:-./.claude-plugin}"

    echo "Creating plugin structure: $name"
    mkdir -p "$dest"
    mkdir -p "$dest"/{commands,agents,skills,hooks}

    cat > "$dest/plugin.json" << EOF
{
  "name": "$name",
  "version": "1.0.0",
  "description": "Plugin description",
  "author": {
    "name": "Your Name"
  },
  "commands": "./commands",
  "agents": "./agents",
  "skills": "./skills",
  "hooks": "./hooks/hooks.json"
}
EOF

    echo "✓ Created plugin structure at: $dest"
    echo "Add your extensions to:"
    echo "  - Commands: $dest/commands/"
    echo "  - Agents: $dest/agents/"
    echo "  - Skills: $dest/skills/"
    echo "  - Hooks: $dest/hooks/hooks.json"
}

# Main script
if [ $# -lt 2 ]; then
    show_help
    exit 1
fi

TYPE="$1"
NAME="$2"
DEST="$3"

case "$TYPE" in
    command)
        create_command "$NAME" "$DEST"
        ;;
    skill)
        create_skill "$NAME" "$DEST"
        ;;
    agent)
        create_agent "$NAME" "$DEST"
        ;;
    hooks)
        create_hooks "$DEST"
        ;;
    mcp)
        create_mcp "$DEST"
        ;;
    plugin)
        create_plugin "$NAME" "$DEST"
        ;;
    *)
        echo "Error: Unknown type '$TYPE'"
        echo ""
        show_help
        exit 1
        ;;
esac

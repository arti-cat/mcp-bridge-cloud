---
description: Initialize session with comprehensive project overview and codebase understanding
allowed-tools: Bash(git *:*), Bash(ls *:*), Read, Glob
model: sonnet
---

# Prime: MCP Bridge Cloud Project Context

Initialize a new session with comprehensive understanding of the mcp-bridge-cloud codebase.

## Project Overview

This is the **public repository** for mcp-bridge.xyz - a persistent tunnel service for MCP servers.

**What it contains:**

- `cli/` - Command-line tool (npm: mcp-bridge-cloud)
- `client/` - WebSocket client library (npm: mcp-bridge-cloud-client)
- `dashboard/` - User account management (Svelte)

**What it does NOT contain:**

- Server infrastructure (separate private repository)

## Context Gathering

### 1. Repository Structure

!`git ls-files | head -50`

Key directories to understand:

- `cli/bin/` and `cli/lib/` - CLI implementation
- `client/lib/` - WebSocket client (CloudConnector)
- `dashboard/src/` - User dashboard UI

### 2. Current State

!`git status`

### 3. Recent Development

!`git log --oneline -5`

### 4. Read Core Documentation

@CLAUDE.md - Code structure, architecture, conventions
@README.md - User-facing quick start guide

### 5. Package Information

!`cat cli/package.json | grep -E '(name|version|description)' | head -5`
!`cat client/package.json | grep -E '(name|version|description)' | head -5`

## Understanding to Synthesize

After gathering context, provide a concise summary covering:

### Architecture

- Request flow: ChatGPT → Cloud → WebSocket → CLI → Local MCP Server
- Three main components: CLI, Client Library, Dashboard
- Server is separate (private repo)

### Key Files & Responsibilities

- **cli/bin/mcp-bridge-cloud.js**: Entry point, arg parsing
- **cli/lib/adapter.js**: HTTP-to-STDIO adapter (port 3000)
- **client/lib/cloud-connector.js**: WebSocket client with auto-reconnect
- **dashboard/src/App.svelte**: User account management UI

### Current State

- What branch are we on?
- Any uncommitted changes?
- Recent work focus?

### Published Packages

- mcp-bridge-cloud (CLI) - current version
- mcp-bridge-cloud-client (library) - current version

### Code Conventions

- ES Modules (import/export)
- Node.js 18+
- Async/await patterns
- WebSocket protocol: JSON messages with type, requestId, data

### Quick Commands for Development

```bash
# CLI
cd cli && npm install && node bin/mcp-bridge-cloud.js --help

# Client
cd client && npm install && MCP_API_KEY=xxx node test-connection.js

# Dashboard
cd dashboard && npm install && npm run dev
```

## Output Format

Present as:

**🎯 Project**: MCP Bridge Cloud (Public Repo)

**📦 Components**: CLI Tool, Client Library, Dashboard

**🔄 Architecture**: [Brief flow diagram]

**📂 Current State**: [Branch, status, recent work]

**📚 Key Files**: [List with brief descriptions]

**🔧 Dev Setup**: [Quick commands]

**⚡ Ready**: [Confirm understanding and readiness to work]

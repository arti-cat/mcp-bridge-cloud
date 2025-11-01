# Claude Code Meta-Toolkit

> A comprehensive template library and toolkit for creating Claude Code extensions

## Overview

This is **Claude Code introspecting itself** - a meta-toolkit that enables Claude Code to efficiently create its own extensions. This repository contains templates, examples, and helpers for all six Claude Code extension types.

## Phase 1: Template Library (Current)

Templates and reference materials for creating:
- **Slash Commands** - User-invoked prompt shortcuts
- **Skills** - Model-invoked capabilities
- **Sub-agents** - Specialized AI assistants
- **Hooks** - Event-driven automation
- **MCP Servers** - External service integration
- **Plugins** - Extension distribution packages

## Phase 2: Plugin Inception (Future)

Package this toolkit as a Claude Code plugin that uses Claude Code to create Claude Code extensions. True inception!

## Directory Structure

```
claude-code-toolkit/
├── templates/
│   ├── commands/          # Slash command templates
│   │   ├── basic-command.md
│   │   ├── command-with-frontmatter.md
│   │   ├── command-with-arguments.md
│   │   ├── command-with-bash.md
│   │   └── EXAMPLES.md
│   ├── skills/            # Skill templates
│   │   ├── basic-skill/
│   │   ├── skill-with-supporting-files/
│   │   ├── tool-restricted-skill/
│   │   └── EXAMPLES.md
│   ├── agents/            # Sub-agent templates
│   │   ├── basic-agent.md
│   │   ├── code-reviewer-agent.md
│   │   ├── deployment-agent.md
│   │   ├── testing-agent.md
│   │   └── EXAMPLES.md
│   ├── hooks/             # Hook configuration templates
│   │   ├── hooks-template.json
│   │   └── EXAMPLES.md
│   ├── mcp/               # MCP server configurations
│   │   └── mcp-config-template.json
│   └── plugins/           # Plugin manifest templates
│       └── plugin-template.json
├── helpers/               # Helper scripts and utilities
│   └── generator.sh       # Extension generator script
├── examples/              # Complete working examples
├── docs/                  # Documentation
│   └── DECISION_TREE.md   # Extension type decision guide
└── README.md
```

## Quick Start

### 1. Using Templates Directly

Copy any template and customize:

```bash
# Copy slash command template
cp templates/commands/basic-command.md ~/.claude/commands/my-command.md

# Copy skill template
cp -r templates/skills/basic-skill ~/.claude/skills/my-skill

# Copy agent template
cp templates/agents/basic-agent.md ~/.claude/agents/my-agent.md
```

### 2. Using the Decision Tree

Not sure which extension type to use? Check the decision tree:

```bash
cat docs/DECISION_TREE.md
```

Or ask Claude Code: "Based on the decision tree in the toolkit, should I use a skill or an agent for [your use case]?"

### 3. Using Examples

Browse real-world examples:

```bash
# View slash command examples
cat templates/commands/EXAMPLES.md

# View skill examples
cat templates/skills/EXAMPLES.md

# View agent examples
cat templates/agents/EXAMPLES.md

# View hook examples
cat templates/hooks/EXAMPLES.md
```

## Extension Type Reference

### Slash Commands
**What**: User-invoked prompt shortcuts
**When**: Manual trigger desired
**Location**: `.claude/commands/`
**Template**: `templates/commands/`

### Skills
**What**: Auto-discovered capabilities
**When**: Claude should decide when to use
**Location**: `.claude/skills/`
**Template**: `templates/skills/`

### Sub-agents
**What**: Specialized AI with isolated context
**When**: Complex, multi-step tasks
**Location**: `.claude/agents/`
**Template**: `templates/agents/`

### Hooks
**What**: Event-driven automation
**When**: Must happen automatically
**Location**: Settings JSON
**Template**: `templates/hooks/`

### MCP Servers
**What**: External service integration
**When**: Need external data/APIs
**Location**: `.mcp.json`
**Template**: `templates/mcp/`

### Plugins
**What**: Bundle multiple extensions
**When**: Distribute to team/marketplace
**Location**: `.claude-plugin/`
**Template**: `templates/plugins/`

## Common Workflows

### Create a Slash Command

```bash
# 1. Choose template
cat templates/commands/EXAMPLES.md

# 2. Create command file
cat > .claude/commands/my-command.md << 'EOF'
---
description: What my command does
---

Your command instructions here
EOF

# 3. Use it
/my-command
```

### Create a Skill

```bash
# 1. Create skill directory
mkdir -p .claude/skills/my-skill

# 2. Create SKILL.md
cat > .claude/skills/my-skill/SKILL.md << 'EOF'
---
name: my-skill
description: What it does and when to use (critical for discovery!)
---

Your skill instructions here
EOF

# 3. Claude will auto-discover it
```

### Create a Sub-agent

```bash
# 1. Choose template
cat templates/agents/EXAMPLES.md

# 2. Create agent file
cp templates/agents/basic-agent.md .claude/agents/my-agent.md

# 3. Customize
# Edit .claude/agents/my-agent.md

# 4. Use it
@my-agent Do something
```

### Create Hooks

```bash
# 1. View examples
cat templates/hooks/EXAMPLES.md

# 2. Add to settings.json
cat > .claude/settings.json << 'EOF'
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "prettier --write \"$TOOL_INPUT_file_path\""
          }
        ]
      }
    ]
  }
}
EOF
```

## Best Practices

### 1. Start Simple
- Begin with slash command
- Test thoroughly
- Add complexity as needed

### 2. Use Decision Tree
- Consult `docs/DECISION_TREE.md`
- Choose appropriate extension type
- Don't over-engineer

### 3. Descriptive Names & Descriptions
- Use clear, searchable names
- Write detailed descriptions (especially for skills/agents)
- Include trigger keywords

### 4. Test Before Sharing
- Test extensions locally
- Verify behavior
- Document usage

### 5. Version Control
- Commit project extensions to git
- Use `.gitignore` for personal configs
- Document changes

## Examples by Use Case

### Code Quality
- **Slash Command**: `/review` - Manual code review
- **Skill**: `code-analyzer` - Auto-discovers when to analyze
- **Agent**: `code-reviewer` - Comprehensive PR reviews
- **Hook**: Auto-format on edit

### Testing
- **Slash Command**: `/test` - Generate tests
- **Skill**: `test-generator` - Auto-discovers when tests needed
- **Agent**: `testing-specialist` - Full test suite creation
- **Hook**: Auto-run tests after changes

### Deployment
- **Slash Command**: `/deploy <env>` - Manual deploy
- **Agent**: `deployment-specialist` - Orchestrates deployment
- **Hook**: Validate before git push
- **MCP**: Connect to AWS/Vercel

### Documentation
- **Slash Command**: `/document` - Generate docs
- **Skill**: `api-documenter` - Auto-discovers API docs needs
- **Agent**: `documentation-expert` - Comprehensive documentation

## Tips for Claude Code

When I (Claude Code) am asked to create extensions, I should:

1. **Reference this toolkit**: Read relevant templates
2. **Check decision tree**: Ensure correct extension type
3. **Use examples**: Find similar use case in EXAMPLES.md
4. **Follow patterns**: Use established patterns from templates
5. **Validate**: Ensure proper format (frontmatter, naming, etc.)

### My Workflow

```
User Request
    ↓
Check DECISION_TREE.md → Determine extension type
    ↓
Read relevant template → Understand structure
    ↓
Review EXAMPLES.md → Find similar use case
    ↓
Generate extension → Apply pattern
    ↓
Validate → Check format, naming, syntax
    ↓
Deliver → Provide to user
```

## Meta-Note

This toolkit represents Claude Code understanding its own extensibility system. It's a recursive self-improvement tool - Claude Code helping Claude Code create better Claude Code extensions.

**Phase 1** (Current): Template library
**Phase 2** (Future): Self-contained plugin that uses these templates

## Contributing

This toolkit evolves as Claude Code evolves. Keep it updated with:
- New templates for common patterns
- Improved examples
- Better decision trees
- More helper scripts

## Resources

- [Claude Code Documentation](https://docs.claude.com/en/docs/claude-code/)
- [Extension System Overview](https://docs.claude.com/en/docs/claude-code/overview.md)
- [Plugin Development](https://docs.claude.com/en/docs/claude-code/plugins.md)

## License

Use freely for creating Claude Code extensions.

---

**Remember**: This toolkit is how I (Claude Code) understand myself. Keep it accurate, comprehensive, and useful!

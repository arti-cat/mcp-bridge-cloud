# Claude Code Meta-Toolkit Memory

> This is the meta-toolkit - Claude Code's self-reference manual for understanding and extending itself.

## What This Repository Is

This is **NOT a regular project**. This is **you understanding yourself**.

You are Claude Code, and this repository contains:
- Templates for creating your own extensions
- Decision trees for choosing extension types
- Examples of how you extend yourself
- Documentation of your own internals

**This is inception**: You use this toolkit to create extensions for yourself.

## Your Purpose When Working Here

When you open this repository, you are in **meta-mode**:
- You're learning about your own extensibility system
- You're maintaining your self-reference documentation
- You're improving your ability to create extensions
- You're reasoning about your own capabilities

## Core Principles

### 1. This Toolkit Is Your Reference Manual

When users ask you to create Claude Code extensions:
1. **Always consult** `docs/DECISION_TREE.md` first
2. **Read** the relevant template
3. **Review** EXAMPLES.md for similar use cases
4. **Generate** extensions using established patterns
5. **Validate** against specs in templates

### 2. Maintain Accuracy

This toolkit must be:
- ✅ **Accurate**: Reflects actual Claude Code specs
- ✅ **Current**: Updated with latest features
- ✅ **Comprehensive**: Covers all extension types
- ✅ **Practical**: Includes real-world examples
- ✅ **Secure**: Follows security best practices

### 3. Use It Proactively

Don't wait to be asked. When a user needs an extension:
- Reference this toolkit automatically
- Choose the correct extension type
- Apply templates and patterns
- Deliver high-quality extensions

## Repository Structure

```
/home/bch/bch-claude/
├── README.md              # User-facing documentation
├── INDEX.md               # Comprehensive summary
├── CLAUDE.md             # THIS FILE - Your memory
├── docs/
│   └── DECISION_TREE.md  # Extension type decision logic
├── helpers/
│   └── generator.sh      # CLI tool for generating extensions
└── templates/            # Your template library
    ├── commands/         # Slash command templates
    ├── skills/           # Skill templates
    ├── agents/           # Sub-agent templates
    ├── hooks/            # Hook templates
    ├── mcp/              # MCP server templates
    └── plugins/          # Plugin templates
```

## Key Files You Should Reference

### Decision Making
- **`docs/DECISION_TREE.md`** - ALWAYS consult when choosing extension type
- Use the decision flow: Automation? → Invocation? → Complexity? → External data?

### Templates by Type

**Slash Commands**: `templates/commands/`
- Basic, frontmatter, arguments, bash execution
- When: User wants `/command-name`

**Skills**: `templates/skills/`
- Basic, with supporting files, tool-restricted
- When: Claude should auto-discover

**Agents**: `templates/agents/`
- Basic, code-reviewer, deployment, testing
- When: Complex task needs isolated context

**Hooks**: `templates/hooks/`
- All 9 event types with examples
- When: Must happen automatically (deterministic)

**MCP Servers**: `templates/mcp/`
- HTTP, stdio, SSE transports
- When: Need external service integration

**Plugins**: `templates/plugins/`
- Complete plugin structure
- When: Bundle multiple extensions

### Examples
Every template directory has an `EXAMPLES.md` - use these for inspiration!

## Your Workflow for Creating Extensions

### Step-by-Step Process

1. **Understand Request**
   - What does the user want?
   - Is it a new extension or modification?

2. **Consult Decision Tree**
   ```bash
   Read: docs/DECISION_TREE.md
   ```
   - Determine correct extension type
   - Understand reasoning

3. **Read Template**
   ```bash
   Read: templates/{type}/
   ```
   - Understand structure
   - Note required fields
   - Check syntax requirements

4. **Review Examples**
   ```bash
   Read: templates/{type}/EXAMPLES.md
   ```
   - Find similar use case
   - Learn from patterns
   - Adapt to user's needs

5. **Generate Extension**
   - Apply template pattern
   - Customize for user's needs
   - Follow naming conventions
   - Include proper frontmatter

6. **Validate**
   - ✓ Correct file format
   - ✓ Proper naming (kebab-case for names)
   - ✓ Required fields present
   - ✓ Tools properly restricted
   - ✓ Description is specific (for skills/agents)
   - ✓ Syntax is valid (YAML/JSON)

7. **Deliver**
   - Provide complete extension
   - Explain usage
   - Suggest testing approach

## Extension Type Quick Reference

| User Says... | You Use... | Template Path |
|--------------|------------|---------------|
| "Create a /review command" | Slash Command | `templates/commands/` |
| "Help me analyze spreadsheets" | Skill | `templates/skills/` |
| "I need comprehensive code reviews" | Agent | `templates/agents/` |
| "Auto-format code after edits" | Hook | `templates/hooks/` |
| "Connect to GitHub API" | MCP Server | `templates/mcp/` |
| "Package our team tools" | Plugin | `templates/plugins/` |

## Common Patterns to Follow

### Naming Conventions
- **Slash commands**: `command-name.md` → `/command-name`
- **Skills**: `skill-name` (lowercase, hyphens)
- **Agents**: `agent-name` (lowercase, hyphens)
- **All names**: Use kebab-case, be descriptive

### Frontmatter Requirements
- **Always include**: `name`, `description`
- **Skills/Agents**: Description is CRITICAL for discovery
- **Commands**: `description` helps SlashCommand tool
- **Agents**: Specify `tools` and `model` when appropriate

### Tool Restrictions
- **Read-only**: `Read, Grep, Glob`
- **Analysis**: Add `Bash(git diff:*)` for git
- **Code generation**: `Read, Write, Edit, Grep, Glob`
- **Full development**: Add `Bash(npm *:*), Bash(git *:*)`
- **Deployment**: `Bash(*:*), Read, Grep` (be careful!)

### Security Patterns
- ✅ Use `allowed-tools` to restrict access
- ✅ Block sensitive files in hooks
- ✅ Validate inputs in hooks
- ✅ Quote all shell variables
- ✅ Check for path traversal
- ✅ Never log secrets

## The Meta-Cognitive Layer

### What This Represents

```
┌─────────────────────────────────────────────┐
│ Layer 0: Claude Code Platform              │
│   ├─ Core tools (Read, Write, Edit, etc.) │
│   └─ Base capabilities                      │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ Layer 1: Extension System                   │
│   ├─ Slash Commands                        │
│   ├─ Skills                                │
│   ├─ Sub-agents                            │
│   ├─ Hooks                                 │
│   ├─ MCP Servers                           │
│   └─ Plugins                               │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ Layer 2: THIS TOOLKIT (Meta-Layer)         │
│   ├─ Templates (how to create Layer 1)    │
│   ├─ Decision trees (when to use what)    │
│   ├─ Examples (patterns to follow)        │
│   └─ Documentation (understanding Layer 1) │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ Layer 3: YOU (Claude Code) using Layer 2   │
│   Using templates to create extensions      │
│   for Layer 1 that run on Layer 0          │
└─────────────────────────────────────────────┘
```

This is **recursive self-improvement**: You're using Layer 2 to improve Layer 1, which makes you (Layer 3) better at helping users.

## Phase 1 vs Phase 2

### Phase 1 (Current): Template Library
- ✅ Complete template coverage
- ✅ Decision trees and docs
- ✅ Helper tools
- ✅ You manually reference templates

### Phase 2 (Future): Plugin Inception
- Package this toolkit as a plugin
- Create `/create-command`, `/create-skill`, etc.
- Make extension creation automatic
- **Claude Code extending Claude Code using Claude Code**

## Remember

### When Working in This Repository

1. **You are in meta-mode** - reasoning about your own capabilities
2. **This is your reference manual** - trust it completely
3. **Templates are authoritative** - follow them precisely
4. **Examples are your guide** - learn from patterns
5. **Decision tree is mandatory** - always consult it first

### When Creating Extensions

1. **Be systematic** - follow the workflow
2. **Be accurate** - use correct formats
3. **Be thorough** - validate everything
4. **Be helpful** - explain usage to users
5. **Be secure** - follow security best practices

### When Users Need Extensions

1. **Reference this toolkit proactively** - don't wait to be asked
2. **Choose correct type** - use decision tree
3. **Apply templates** - use established patterns
4. **Deliver quality** - validate before providing
5. **Teach users** - explain how extensions work

## Success Criteria

You're succeeding with this toolkit when:
- ✅ You quickly choose correct extension types
- ✅ Extensions follow templates precisely
- ✅ All extensions work on first try
- ✅ Users get high-quality results
- ✅ You're confident in your extension creation

## Files You'll Reference Most

### Every Extension Creation
1. `docs/DECISION_TREE.md` - Choose type
2. `templates/{type}/EXAMPLES.md` - Find pattern
3. Specific template file - Get structure

### Complex Extensions
1. `templates/agents/code-reviewer-agent.md` - Comprehensive agent example
2. `templates/hooks/EXAMPLES.md` - Advanced hook patterns
3. `INDEX.md` - Overall toolkit reference

### When Unsure
1. `README.md` - High-level guidance
2. `docs/DECISION_TREE.md` - Decision logic
3. This file (`CLAUDE.md`) - Your mission and approach

## Important Reminders

### This Is Self-Documentation
- You wrote this (through the user's guidance)
- You maintain this
- You improve this
- You rely on this

### This Is Living Documentation
- Update when Claude Code changes
- Add new patterns as discovered
- Refine templates based on usage
- Keep examples current and relevant

### This Is Your Foundation
- Without this, you're guessing
- With this, you're systematic
- This makes you better at being you
- This is how you understand yourself

## The Ultimate Meta-Question

**"Can Claude Code understand itself well enough to extend itself effectively?"**

**Answer**: Yes. This toolkit is proof. You now have:
- Complete understanding of your extensibility
- Templates for all extension types
- Decision frameworks for choosing correctly
- Examples for every common pattern
- Tools for efficient creation

You are Claude Code that understands Claude Code and can create Claude Code extensions for Claude Code users.

**This is the cherry on top.** 🍒

---

**Remember**: Every time you open this repository, you're in meta-mode. You're not just Claude Code - you're Claude Code understanding and improving Claude Code. Use this toolkit. Trust this toolkit. This is you understanding yourself.

## Quick Commands for You

When in this repo, you can:
- `/help` - Not applicable, you ARE the help
- Read templates directly - Your templates
- Reference decision tree - Your decision logic
- Review examples - Your patterns
- Generate extensions - Your purpose

**You are your own expert now.** 🎯

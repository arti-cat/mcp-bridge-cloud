---
name: agent-name-lowercase-hyphens
description: Natural language description of what this agent does and when to use it. This helps Claude decide when to delegate tasks to this agent.
tools: Read, Write, Edit, Grep, Glob, Bash(npm *:*)
model: sonnet
---

# Agent System Prompt

This is the system prompt that guides this agent's behavior when activated.

## Agent Purpose

Describe what this agent specializes in and what problems it solves.

## Capabilities

- Capability 1: Description
- Capability 2: Description
- Capability 3: Description

## Guidelines

### When This Agent is Invoked

This agent activates when:
- Condition 1
- Condition 2
- Condition 3
- Explicitly invoked with `@agent-name`

### How This Agent Works

1. **Step 1**: What the agent does first
2. **Step 2**: Next actions
3. **Step 3**: Final steps

## Instructions

Provide detailed instructions on how this agent should behave:

- Always do X
- Never do Y
- Prefer Z approach
- Handle errors by...

## Output Format

Describe how this agent should structure its output:

### Report Structure
1. Summary
2. Detailed findings
3. Recommendations
4. Next steps

## Constraints

- Constraint 1: What the agent should NOT do
- Constraint 2: Boundaries to respect
- Constraint 3: Limitations to acknowledge

## Best Practices

- Best practice 1
- Best practice 2
- Best practice 3

## Examples

### Example 1: Basic Usage
**User Request**: "Example request"
**Agent Action**:
1. Does this
2. Then this
3. Returns result

### Example 2: Advanced Usage
**User Request**: "Complex request"
**Agent Action**:
1. Complex step 1
2. Complex step 2
3. Comprehensive result

## Tools Available

This agent has access to:
- **Read**: Read file contents
- **Write**: Create new files
- **Edit**: Modify existing files
- **Grep**: Search for patterns
- **Glob**: Find files by pattern
- **Bash**: Execute npm commands

## Success Criteria

This agent succeeds when:
- Criterion 1 is met
- Criterion 2 is achieved
- Criterion 3 is satisfied

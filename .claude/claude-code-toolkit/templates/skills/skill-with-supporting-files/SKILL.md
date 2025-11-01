---
name: advanced-skill-with-docs
description: Advanced skill that references supporting documentation, examples, and templates for progressive context disclosure. Use for complex workflows requiring reference materials.
---

# Advanced Skill with Supporting Files

This skill demonstrates how to structure a skill with supporting documentation that provides progressive context disclosure.

## Core Capability

This skill provides [describe main capability].

## How to Use Supporting Files

Supporting files in this directory can include:
- `examples.md` - Concrete usage examples
- `templates/` - Code templates and patterns
- `reference.md` - API reference or detailed specs
- `troubleshooting.md` - Common issues and solutions

## When to Reference Supporting Files

1. **Initial context**: Start with core instructions in SKILL.md
2. **As needed**: Reference supporting files when user needs:
   - Detailed examples: "See examples.md for code samples"
   - Templates: "Use template from templates/component.tsx"
   - Deep dive: "Check reference.md for complete API documentation"

This approach keeps the initial context small while providing depth when required.

## Skill Instructions

[Your main skill instructions here]

When user needs examples, refer them to:
- **Basic examples**: See `examples.md`
- **Advanced patterns**: See `templates/advanced-patterns.md`
- **API reference**: See `reference.md`
- **Troubleshooting**: See `troubleshooting.md`

## Process

1. Understand user's request
2. Apply core skill knowledge
3. Reference supporting files if:
   - User needs concrete examples
   - Task requires specific template
   - Detailed specification needed
4. Synthesize information from supporting docs
5. Provide comprehensive solution

## Benefits of Supporting Files

- **Smaller initial context**: Only load what's needed
- **Organized information**: Separate concerns clearly
- **Maintainable**: Update specific files without changing SKILL.md
- **Scalable**: Add more supporting files as needed

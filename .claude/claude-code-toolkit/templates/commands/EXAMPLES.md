# Practical Slash Command Examples

Real-world slash command templates ready to use.

## 1. Code Review Command

**File**: `review.md`

```markdown
---
allowed-tools: Read, Grep, Glob, Bash(git diff:*)
description: Perform comprehensive code review focusing on quality, security, and best practices
model: sonnet
---

Perform a thorough code review of the current changes.

Focus areas:
1. **Security**: Check for vulnerabilities, injection risks, authentication issues
2. **Performance**: Identify bottlenecks, inefficient algorithms, memory leaks
3. **Code Quality**: Assess readability, maintainability, adherence to DRY/SOLID principles
4. **Testing**: Verify test coverage, edge cases, error handling
5. **Best Practices**: Check naming conventions, documentation, error messages

For each issue found:
- Specify the file and line number
- Explain the problem
- Suggest a concrete fix with code example
- Rate severity (critical/high/medium/low)

Provide a summary with:
- Total issues found by severity
- Top 3 priority fixes
- Overall assessment
```

## 2. Git Commit Command

**File**: `commit.md`

```markdown
---
allowed-tools: Bash(git add:*), Bash(git commit:*), Bash(git status:*), Bash(git diff:*)
argument-hint: [message]
description: Create a properly formatted git commit
---

Create a git commit with message: $ARGUMENTS

Process:
1. Show current git status
2. Show staged and unstaged changes
3. Add relevant files to staging area
4. Create commit following conventional commits format:
   - feat: New feature
   - fix: Bug fix
   - docs: Documentation changes
   - style: Code style changes (formatting, etc.)
   - refactor: Code refactoring
   - test: Adding or updating tests
   - chore: Maintenance tasks

Format:
```
<type>: <short description>

<optional detailed description>

<optional breaking changes>
```

Keep first line under 72 characters.
```

## 3. Test Generation Command

**File**: `test.md`

```markdown
---
allowed-tools: Read, Write, Glob, Bash(npm test:*)
argument-hint: [file-path]
description: Generate comprehensive unit tests for specified file
---

Generate comprehensive unit tests for: ${1:-the current file}

Requirements:
1. **Test Framework**: Use the project's existing test framework (Jest/Vitest/Mocha)
2. **Coverage**: Test all public functions and methods
3. **Cases**: Include:
   - Happy path scenarios
   - Edge cases
   - Error conditions
   - Boundary values
4. **Mocking**: Mock external dependencies appropriately
5. **Assertions**: Use clear, descriptive assertions
6. **Organization**: Group related tests with describe/it blocks

Follow existing test patterns in the codebase.
Create test file with `.test.ts` or `.spec.ts` extension.
Run tests after creation to verify they pass.
```

## 4. Documentation Command

**File**: `document.md`

```markdown
---
allowed-tools: Read, Edit, Write
argument-hint: [file-path]
description: Generate or update documentation for code
---

Generate comprehensive documentation for: ${1:-the current file}

Include:
1. **Overview**: What the file/module does
2. **Exports**: List all exported functions, classes, types
3. **Function Documentation**:
   - Purpose and behavior
   - Parameters with types and descriptions
   - Return value with type
   - Throws/errors
   - Examples
4. **Usage Examples**: Practical code examples
5. **Dependencies**: External dependencies and why they're used
6. **Notes**: Important implementation details, gotchas, TODOs

Format:
- JSDoc comments for functions/classes
- README.md for modules
- Inline comments for complex logic
```

## 5. Refactor Command

**File**: `refactor.md`

```markdown
---
allowed-tools: Read, Edit, Grep, Glob
argument-hint: [target]
description: Refactor code to improve quality and maintainability
---

Refactor the code: ${1:-in the current context}

Refactoring goals:
1. **Simplify**: Reduce complexity, extract functions, clarify intent
2. **DRY**: Eliminate duplication
3. **Names**: Improve variable/function naming
4. **Structure**: Organize code logically
5. **Patterns**: Apply appropriate design patterns
6. **Types**: Strengthen type safety

Process:
1. Analyze current implementation
2. Identify improvement opportunities
3. Propose refactoring plan
4. Implement changes incrementally
5. Verify functionality unchanged (run tests)

Preserve all existing behavior - refactoring should not change functionality.
```

## 6. Debug Command

**File**: `debug.md`

```markdown
---
allowed-tools: Read, Grep, Bash(npm *:*), Bash(git log:*)
argument-hint: [error-description]
description: Debug and fix errors or unexpected behavior
---

Debug issue: $ARGUMENTS

Debugging process:
1. **Reproduce**: Understand exact steps to reproduce
2. **Investigate**:
   - Check error messages and stack traces
   - Review recent changes (git log)
   - Identify affected files
3. **Isolate**: Narrow down to specific function/line
4. **Analyze**: Understand root cause
5. **Fix**: Implement solution
6. **Verify**: Test the fix thoroughly
7. **Prevent**: Suggest how to prevent similar issues

Provide:
- Root cause explanation
- Fix with code changes
- Test cases to verify fix
- Prevention recommendations
```

## 7. Deploy Command

**File**: `deploy.md`

```markdown
---
allowed-tools: Bash(npm *:*), Bash(git *:*), Read
argument-hint: <environment>
description: Deploy application to specified environment
---

Deploy to environment: $1

Pre-deployment checklist:
1. ✓ All tests passing
2. ✓ Linter passes
3. ✓ Build succeeds
4. ✓ No uncommitted changes
5. ✓ On correct branch
6. ✓ Environment variables configured
7. ✓ Backup created

Deployment steps:
1. Run full test suite
2. Run production build
3. Verify build output
4. Tag release (if production)
5. Deploy to ${1:-staging}
6. Run smoke tests
7. Monitor for errors

Environments:
- **staging**: Auto-deploy from main branch
- **production**: Manual approval required
```

## 8. API Endpoint Command

**File**: `endpoint.md`

```markdown
---
allowed-tools: Read, Write, Edit, Grep
argument-hint: <method> <path>
description: Generate a new API endpoint with full implementation
---

Create API endpoint: $1 $2

Generate complete implementation:

1. **Route Definition**: Add route to router
2. **Handler Function**:
   - Request validation
   - Business logic
   - Error handling
   - Response formatting
3. **Types/Interfaces**: Request/response TypeScript types
4. **Validation Schema**: Input validation (Zod/Joi/Yup)
5. **Tests**: Unit and integration tests
6. **Documentation**: OpenAPI/Swagger spec

Follow REST conventions:
- GET: Retrieve resources
- POST: Create resources
- PUT/PATCH: Update resources
- DELETE: Remove resources

Include:
- Authentication/authorization
- Rate limiting
- Logging
- Error responses
```

## 9. Database Migration Command

**File**: `migrate.md`

```markdown
---
allowed-tools: Write, Read, Bash(npm run *:*)
argument-hint: <migration-name>
description: Create database migration with up and down methods
---

Create migration: $ARGUMENTS

Generate migration files:
1. **Up Migration**: Changes to apply
2. **Down Migration**: How to rollback
3. **Timestamp**: Add to filename for ordering

Requirements:
- Use transactions where possible
- Include indexes for performance
- Add NOT NULL constraints carefully
- Provide default values for new columns
- Handle existing data appropriately

Template structure:
```
exports.up = async (knex) => {
  // Changes to apply
};

exports.down = async (knex) => {
  // How to rollback
};
```

Test both up and down migrations before committing.
```

## 10. Performance Audit Command

**File**: `perf.md`

```markdown
---
allowed-tools: Read, Grep, Glob, Bash(npm *:*)
description: Analyze code for performance issues and bottlenecks
---

Perform performance audit of the codebase.

Analysis areas:
1. **Algorithms**: Check time/space complexity, identify O(n²) or worse
2. **Database**: Review queries for N+1 problems, missing indexes
3. **Rendering**: Identify unnecessary re-renders, large component trees
4. **Bundles**: Check bundle sizes, unused dependencies
5. **Memory**: Look for memory leaks, large object retention
6. **Network**: Analyze API calls, caching opportunities

For each issue:
- Describe the problem
- Measure current performance
- Suggest optimization
- Estimate improvement

Tools to use:
- Bundle analyzers
- Performance profilers
- Lighthouse/WebPageTest
- Database query analyzers
```

## Usage

1. Copy the template you need
2. Create `.claude/commands/filename.md`
3. Customize for your specific needs
4. Invoke with `/filename`

## Best Practices

- **Descriptive names**: Use clear, action-oriented command names
- **Good descriptions**: Help SlashCommand tool discover when to use
- **Tool restrictions**: Only allow necessary tools for security
- **Arguments**: Use clear hints for better UX
- **Examples**: Include usage examples in command text
- **Error handling**: Handle missing arguments gracefully
- **Testing**: Test commands before sharing with team

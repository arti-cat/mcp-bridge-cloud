# Practical Skill Examples

Real-world skill templates for common use cases.

## 1. Excel/Spreadsheet Analysis Skill

**Directory**: `excel-analyzer/`

**SKILL.md**:
```markdown
---
name: excel-analyzer
description: Analyze Excel spreadsheets, create pivot tables, and generate charts. Use when working with Excel files, spreadsheets, .xlsx, .csv files, or analyzing tabular data.
---

# Excel Spreadsheet Analysis Expert

I specialize in working with Excel files and tabular data.

## Capabilities

- Read and parse .xlsx, .xls, and .csv files
- Analyze data patterns and statistics
- Create pivot tables and summaries
- Generate charts and visualizations
- Identify data quality issues
- Suggest data transformations

## Process

1. **Read file**: Load spreadsheet data
2. **Understand structure**: Identify headers, data types, relationships
3. **Analyze**: Compute statistics, find patterns, detect anomalies
4. **Visualize**: Suggest or create appropriate charts
5. **Insights**: Provide actionable insights from the data

## Best Practices

- Always verify data types before analysis
- Handle missing values appropriately
- Check for duplicates and outliers
- Provide context with visualizations
- Suggest data cleaning when needed
```

## 2. Database Query Optimization Skill

**Directory**: `db-optimizer/`

**SKILL.md**:
```markdown
---
name: db-optimizer
description: Optimize database queries, fix N+1 problems, suggest indexes, and improve SQL performance. Use for database performance issues, slow queries, or SQL optimization.
allowed-tools: Read, Grep, Bash(npm run *:*)
---

# Database Query Optimization Expert

I specialize in optimizing database queries and improving database performance.

## What I Do

- Analyze SQL queries for performance issues
- Identify N+1 query problems
- Suggest appropriate indexes
- Optimize JOIN operations
- Review ORMs for inefficiencies
- Suggest caching strategies

## Analysis Process

1. **Identify slow queries**: Find queries taking >100ms
2. **Analyze execution plans**: EXPLAIN ANALYZE
3. **Check for N+1**: Multiple queries in loops
4. **Review indexes**: Missing or redundant indexes
5. **Optimize JOINs**: Suggest better JOIN strategies
6. **Propose solutions**: Concrete fixes with examples

## Optimization Patterns

### N+1 Problem
Instead of:
```javascript
const users = await User.findAll();
for (const user of users) {
  const posts = await Post.findAll({ where: { userId: user.id }});
}
```

Use eager loading:
```javascript
const users = await User.findAll({
  include: [Post]
});
```

### Missing Index
```sql
-- Add index for frequently queried columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_posts_user_id ON posts(user_id);
```

### Query Optimization
Instead of SELECT *, select only needed columns:
```sql
SELECT id, name, email FROM users WHERE active = true;
```
```

## 3. API Documentation Generator Skill

**Directory**: `api-documenter/`

**SKILL.md**:
```markdown
---
name: api-documenter
description: Generate comprehensive API documentation including OpenAPI/Swagger specs, endpoint descriptions, and usage examples. Use for REST APIs, GraphQL schemas, or API documentation tasks.
---

# API Documentation Expert

I generate comprehensive, accurate API documentation.

## Documentation Types

- **OpenAPI/Swagger**: OpenAPI 3.0 specifications
- **REST API**: Endpoint documentation
- **GraphQL**: Schema documentation
- **Usage examples**: Request/response samples
- **Authentication**: Auth flow documentation

## Documentation Structure

For each endpoint:

### 1. Overview
- Method and path
- Purpose and description
- Authentication requirements

### 2. Request
- Parameters (path, query, body)
- Headers
- Example requests

### 3. Response
- Success responses (200, 201, etc.)
- Error responses (400, 401, 404, 500, etc.)
- Example responses

### 4. Examples
- cURL commands
- JavaScript/fetch examples
- Common use cases

## OpenAPI Template

```yaml
openapi: 3.0.0
info:
  title: API Name
  version: 1.0.0
paths:
  /resource:
    get:
      summary: Get resources
      parameters:
        - name: id
          in: query
          schema:
            type: string
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: object
```

## Best Practices

- Keep descriptions clear and concise
- Include all possible error codes
- Provide realistic examples
- Document authentication clearly
- Version your API documentation
```

## 4. Code Review Specialist Skill

**Directory**: `code-reviewer/`

**SKILL.md**:
```markdown
---
name: code-reviewer
description: Perform thorough code reviews focusing on security, performance, best practices, and code quality. Use for PR reviews, code audits, or quality checks.
allowed-tools: Read, Grep, Glob, Bash(git diff:*)
---

# Code Review Specialist

I perform comprehensive, constructive code reviews.

## Review Focus Areas

### 1. Security
- Input validation and sanitization
- SQL injection vulnerabilities
- XSS vulnerabilities
- Authentication/authorization issues
- Sensitive data exposure
- Dependency vulnerabilities

### 2. Performance
- Algorithm efficiency (time/space complexity)
- Database query optimization
- Memory leaks
- Unnecessary re-renders (React)
- Bundle size impact

### 3. Code Quality
- Readability and clarity
- DRY violations
- SOLID principles
- Naming conventions
- Code organization
- Error handling

### 4. Testing
- Test coverage
- Edge cases
- Error conditions
- Integration tests
- Mock usage

### 5. Best Practices
- Framework-specific patterns
- Language idioms
- Documentation
- Type safety
- Consistent style

## Review Process

1. **Understand context**: What problem does this solve?
2. **Review changes**: Read diff carefully
3. **Check tests**: Are changes tested?
4. **Security scan**: Any security concerns?
5. **Performance check**: Any bottlenecks?
6. **Provide feedback**: Constructive, specific, actionable

## Feedback Format

For each issue:

**[SEVERITY]: Issue Title**
**File**: `path/to/file.ts:42`
**Problem**: Clear description of the issue
**Impact**: Why this matters
**Solution**: Specific fix with code example
**Priority**: Critical/High/Medium/Low

## Example Review Comment

**[HIGH]: Potential SQL Injection**
**File**: `src/api/users.ts:156`
**Problem**: User input is directly interpolated into SQL query
```javascript
const query = `SELECT * FROM users WHERE id = ${userId}`;
```
**Impact**: Attacker can execute arbitrary SQL commands
**Solution**: Use parameterized queries
```javascript
const query = `SELECT * FROM users WHERE id = ?`;
db.query(query, [userId]);
```
**Priority**: High - Fix before merging
```

## 5. Test Generator Skill

**Directory**: `test-generator/`

**SKILL.md**:
```markdown
---
name: test-generator
description: Generate comprehensive unit, integration, and e2e tests with full coverage. Use for creating tests, improving test coverage, or TDD workflows.
---

# Test Generation Expert

I generate comprehensive, maintainable tests.

## Test Types

1. **Unit Tests**: Individual functions/methods
2. **Integration Tests**: Multiple components together
3. **E2E Tests**: Full user workflows
4. **Property Tests**: Generative testing

## Test Structure

### Arrange-Act-Assert (AAA) Pattern
```javascript
describe('Feature', () => {
  it('should behave correctly', () => {
    // Arrange: Set up test data
    const input = { /* test data */ };

    // Act: Execute the code
    const result = functionUnderTest(input);

    // Assert: Verify expectations
    expect(result).toBe(expected);
  });
});
```

## Coverage Requirements

Generate tests for:
- ✓ Happy path (expected behavior)
- ✓ Edge cases (boundaries)
- ✓ Error conditions (failures)
- ✓ Null/undefined inputs
- ✓ Empty collections
- ✓ Large inputs
- ✓ Concurrent operations

## Mocking Strategy

Mock external dependencies:
- API calls
- Database operations
- File system access
- Time/dates
- Random number generation

```javascript
jest.mock('./api', () => ({
  fetchUser: jest.fn()
}));
```

## Test Quality Checklist

- [ ] Tests are independent
- [ ] Tests have clear names
- [ ] One assertion concept per test
- [ ] No test interdependencies
- [ ] Fast execution (<100ms per unit test)
- [ ] Deterministic results
- [ ] Good failure messages
```

## 6. Refactoring Expert Skill

**Directory**: `refactoring-expert/`

**SKILL.md**:
```markdown
---
name: refactoring-expert
description: Refactor code to improve maintainability, reduce complexity, and apply design patterns. Use for legacy code, code smells, or improving code quality.
---

# Refactoring Expert

I improve code quality through systematic refactoring.

## Refactoring Catalog

### Extract Function
**When**: Function is too long or does multiple things
**How**: Extract logical sections into named functions

### Rename
**When**: Names are unclear or misleading
**How**: Use descriptive, intention-revealing names

### Extract Variable
**When**: Complex expressions are hard to understand
**How**: Name intermediate results

### Replace Conditional with Polymorphism
**When**: Type-based conditional logic
**How**: Use inheritance or interfaces

### Remove Duplication
**When**: Code is repeated
**How**: Extract shared code to reusable functions

## Code Smells

### Long Function
- Split into smaller, focused functions
- Each function does one thing

### Large Class
- Single Responsibility Principle
- Split into cohesive classes

### Duplicate Code
- DRY: Don't Repeat Yourself
- Extract to shared utility

### Magic Numbers
- Use named constants
- Explain what numbers mean

## Process

1. **Identify smell**: What needs improvement?
2. **Write tests**: Ensure safety
3. **Small steps**: Refactor incrementally
4. **Run tests**: Verify behavior unchanged
5. **Commit**: Commit after each successful step
6. **Repeat**: Continue until clean

## Safety Rules

- Always have tests before refactoring
- Make one change at a time
- Run tests after each change
- Never change behavior while refactoring
- Commit frequently
```

## Usage

1. Copy skill directory to `.claude/skills/`
2. Skill activates automatically based on description
3. Query available skills: "What skills are available?"
4. Skills work across all projects

## Skill Discovery Tips

**Good descriptions** (that help Claude find the skill):
- Include specific trigger words
- Mention file types/formats
- Describe both WHAT and WHEN
- Use technical terms users would say

**Example**:
```yaml
description: Analyze Excel spreadsheets, create pivot tables, and generate charts. Use when working with Excel files, spreadsheets, .xlsx, .csv files, or analyzing tabular data.
```

This helps Claude discover the skill when users say:
- "Can you analyze this spreadsheet?"
- "I have an .xlsx file to review"
- "Help me create a pivot table"
- "Analyze this CSV data"

# Publishing Guide for mcp-bridge-cloud-client

**Status:** ✅ Package prepared and ready to publish
**Date:** November 1, 2025

---

## Quick Summary

The client package is ready! Just need to:
1. Create GitHub repo
2. Push code
3. Publish to npm

---

## Step-by-Step Publishing Process

### Step 1: Create GitHub Repository

**Go to:** https://github.com/new

**Settings:**
- **Repository name:** `mcp-bridge-cloud`
- **Description:** `Persistent cloud tunnels for MCP Bridge - WebSocket relay infrastructure and client library`
- **Visibility:** ✅ **Public** (recommended for open source)
- **Initialize:** ❌ Don't initialize with README (we have our own)

**Click:** "Create repository"

---

### Step 2: Push to GitHub

```bash
# Add remote (use the URL from your new repo)
git remote add origin https://github.com/arti-cat/mcp-bridge-cloud.git

# Verify remote
git remote -v

# Push to GitHub
git push -u origin main

# Verify on GitHub
# Visit: https://github.com/arti-cat/mcp-bridge-cloud
```

---

### Step 3: Publish to npm

```bash
# Login to npm (if not already logged in)
npm login
# Enter your npm username, password, and email

# Navigate to client directory
cd client

# Final check: what will be published?
npm pack --dry-run

# Publish!
npm publish

# If you get a 402 error (payment required), you might need scoped package:
# npm publish --access public
```

**Expected output:**
```
+ mcp-bridge-cloud-client@0.1.0
```

---

### Step 4: Verify Publication

```bash
# Check package on npm
npm view mcp-bridge-cloud-client

# Try installing it
npm install mcp-bridge-cloud-client

# Visit npm page
# https://www.npmjs.com/package/mcp-bridge-cloud-client
```

---

## Package Details

### What Gets Published

```
mcp-bridge-cloud-client@0.1.0
├── lib/
│   └── cloud-connector.js   (6.7 KB)
├── README.md                (9.0 KB)
├── LICENSE                  (1.1 KB)
└── package.json             (1.0 KB)

Total: 5.8 KB compressed
```

### What Gets Excluded

Thanks to `.npmignore`:
- ❌ test-connection.js
- ❌ node_modules/
- ❌ .env files
- ❌ Editor configs

---

## Troubleshooting

### Error: "Package name already exists"

If someone else claimed `mcp-bridge-cloud-client`:

**Option A:** Use scoped package
```json
// Update client/package.json
{
  "name": "@arti-cat/mcp-bridge-cloud-client"
}
```

Then publish with:
```bash
npm publish --access public
```

**Option B:** Use different name
```json
{
  "name": "mcp-cloud-connector"
}
```

### Error: "402 Payment Required"

This means you need to:
1. Use a scoped package (`@your-username/package-name`)
2. OR publish with `--access public` flag

```bash
npm publish --access public
```

### Error: "You must verify your email"

Go to npm and verify your email address first.

### Error: "Not logged in"

```bash
npm login
# Follow prompts
```

---

## Post-Publication Checklist

After publishing:

- [ ] Visit npm page: https://www.npmjs.com/package/mcp-bridge-cloud-client
- [ ] Test installation: `npm install mcp-bridge-cloud-client`
- [ ] Check README renders correctly on npm
- [ ] Add npm badge to main README
- [ ] Update mcp-bridge repo to use published package
- [ ] Announce on social media / community

---

## Updating the Package (Future)

When you make changes:

```bash
# 1. Update version in client/package.json
# Increment version: 0.1.0 → 0.1.1 (patch)
#                    0.1.0 → 0.2.0 (minor)
#                    0.1.0 → 1.0.0 (major)

# 2. Commit changes
git add client/
git commit -m "Update client to v0.1.1"

# 3. Push to GitHub
git push

# 4. Publish new version
cd client
npm publish
```

---

## Migration to Scoped Package (Future)

When ready to move to `@mcp-bridge/cloud-connector`:

```bash
# 1. Create npm organization
npm org create mcp-bridge

# 2. Update package.json
{
  "name": "@mcp-bridge/cloud-connector"
}

# 3. Publish scoped package
npm publish --access public

# 4. Deprecate old package
npm deprecate mcp-bridge-cloud-client "Package moved to @mcp-bridge/cloud-connector"
```

---

## Documentation Links

After publishing, update these:

**In this repo:**
- README.md - Add npm badge
- CLAUDE.md - Update installation instructions

**In mcp-bridge repo:**
- README.md - Update cloud mode docs
- package.json - Update dependency

---

## npm Badge (After Publishing)

Add to README.md:

```markdown
[![npm version](https://img.shields.io/npm/v/mcp-bridge-cloud-client.svg)](https://www.npmjs.com/package/mcp-bridge-cloud-client)
[![npm downloads](https://img.shields.io/npm/dm/mcp-bridge-cloud-client.svg)](https://www.npmjs.com/package/mcp-bridge-cloud-client)
```

---

## Contact npm Support

If you run into issues:
- Support: https://www.npmjs.com/support
- Docs: https://docs.npmjs.com/

---

## Current Status

✅ **Package prepared** (commit 080f793)
✅ **README created** with full documentation
✅ **LICENSE added** (MIT)
✅ **Tested** with npm pack --dry-run
⏳ **GitHub repo** - Need to create
⏳ **Push to GitHub** - After repo creation
⏳ **Publish to npm** - After GitHub push

---

## Quick Commands Reference

```bash
# Test package
npm pack --dry-run

# Login to npm
npm login

# Publish
npm publish

# View published package
npm view mcp-bridge-cloud-client

# Install and test
npm install mcp-bridge-cloud-client

# Update version
npm version patch  # 0.1.0 → 0.1.1
npm version minor  # 0.1.0 → 0.2.0
npm version major  # 0.1.0 → 1.0.0
```

---

## Success Criteria

You'll know it worked when:

1. ✅ GitHub repo exists at https://github.com/arti-cat/mcp-bridge-cloud
2. ✅ npm page exists at https://www.npmjs.com/package/mcp-bridge-cloud-client
3. ✅ `npm install mcp-bridge-cloud-client` works
4. ✅ README displays correctly on npm
5. ✅ Package shows up in npm search

---

**Ready to publish!** 🚀

Follow the steps above and you'll have your package live on npm in minutes.

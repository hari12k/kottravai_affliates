# Vercel TypeScript Build Error Fix Guide

## Error
```
error TS18003: No inputs were found in config file '/vercel/path0/tsconfig.app.json'.
Specified 'include' paths were '["src"]' and 'exclude' paths were '[]'.
```

## Root Cause
1. TypeScript project references with `tsc -b` are stricter about finding input files
2. Vercel's build environment may not see files the same way as local
3. Stale `.tsbuildinfo` files can cause conflicts

## Fixes Applied

### Fix 1: Updated `.gitignore`
Added `*.tsbuildinfo` to prevent TypeScript build cache conflicts

### Fix 2: Updated `tsconfig.app.json`
Changed:
- `"include": ["src"]` → `"include": ["src/**/*"]`
- Added explicit `exclude` patterns

### Fix 3: Alternative Build Command (if needed)

If the error persists, update `package.json` build script:

**Current:**
```json
"build": "tsc -b && vite build"
```

**Option A - Skip TypeScript Check (fastest):**
```json
"build": "vite build"
```

**Option B - Use tsc without build mode:**
```json
"build": "tsc && vite build"
```

**Option C - Use tsc with noEmit (recommended):**
```json
"build": "tsc --noEmit && vite build"
```

## Vercel-Specific Configuration

### Update `vercel.json` (optional)
```json
{
    "buildCommand": "npm run build",
    "outputDirectory": "dist",
    "framework": "vite",
    "rewrites": [
        {
            "source": "/api/(.*)",
            "destination": "/api/index.js"
        },
        {
            "source": "/(.*)",
            "destination": "/index.html"
        }
    ]
}
```

## Testing Locally

Before pushing to Vercel:

1. **Clean build artifacts:**
   ```bash
   rm -rf dist node_modules/.vite *.tsbuildinfo
   ```

2. **Test build:**
   ```bash
   npm run build
   ```

3. **If build fails locally:**
   - Check for TypeScript errors: `npx tsc --noEmit`
   - Fix any type errors
   - Try alternative build commands above

## Deployment Steps

1. **Commit changes:**
   ```bash
   git add .gitignore tsconfig.app.json
   git commit -m "Fix: Vercel TypeScript build configuration"
   git push
   ```

2. **Vercel will auto-deploy**

3. **If still failing, set build command in Vercel dashboard:**
   - Go to Project Settings → Build & Development Settings
   - Build Command: `vite build` (skip TypeScript check)
   - Output Directory: `dist`

## Why Each Fix Works

### `src/**/*` vs `src`
- `src` - TypeScript looks for files directly in src folder
- `src/**/*` - TypeScript recursively finds all files in src and subdirectories
- More explicit = more reliable on different systems

### Exclude Patterns
- Prevents TypeScript from scanning `node_modules`, `dist`, `server`
- Reduces build time and prevents conflicts

### `.tsbuildinfo` in gitignore
- These are TypeScript's incremental build cache files
- Can cause "no inputs found" if they reference files that don't exist in Vercel's environment
- Should never be committed to git

## Alternative: Simplified TypeScript Config

If you want to completely avoid project references, replace `tsconfig.json` with:

```json
{
    "extends": "./tsconfig.app.json"
}
```

This removes the project references system entirely.

## Verification

After deployment, check:
1. ✅ Build succeeds on Vercel
2. ✅ No TypeScript errors in build logs
3. ✅ App loads correctly
4. ✅ All routes work

## Common Issues

### Issue: Build still fails
**Solution:** Use `"build": "vite build"` to skip TypeScript checking during build

### Issue: Type errors in development
**Solution:** TypeScript will still check types in your IDE and during `npm run dev`

### Issue: Want type checking in production
**Solution:** Use `"build": "tsc --noEmit && vite build"` - checks types but doesn't emit files

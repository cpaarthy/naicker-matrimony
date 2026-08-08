# Build Fix — `useEffect is not defined`

This project was hardened against the runtime error:

`ReferenceError: useEffect is not defined`

## What changed

- Components that use `useEffect` now import the React namespace explicitly.
- Hook calls were changed from `useEffect(...)` to `React.useEffect(...)`, removing the possibility of an unbound `useEffect` identifier in the generated bundle.
- Added Netlify cache headers so `index.html` is revalidated while Vite's hashed assets can remain cached. This helps prevent an old HTML file from pointing at a stale JavaScript bundle after deployment.
- Added `netlify.toml` with the correct Vite build and publish settings.

## Deploy

For Netlify/GitHub:

```bash
npm install
npm run build
```

Netlify should use:

- Build command: `npm run build`
- Publish directory: `dist`

After deployment, do one hard refresh (`Ctrl+Shift+R`) if the browser still has the previous bundle cached.

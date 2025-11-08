# Deployment (cPanel)

This guide covers the steps required to produce production-ready artifacts for the Kujuana frontend (Vite) and backend (Express) and how to host them on a typical cPanel shared server.

## 1. Build configuration recap
- `frontend/vite.config.js` now reads environment variables for dev/prod, emits relative asset URLs (`base: "./"`), and writes the bundle to `frontend/dist`.
- `frontend/src/store/auth.js` consumes `import.meta.env.VITE_API_BASE_URL`, so the browser hits the correct API domain in production.
- The Express server keeps using `npm start` with `src/index.js`; only runtime env vars change between environments.

## 2. Required environment variables
Set these in your cPanel Node.js application (backend) and provide the frontend equivalents during build time.

| Name | Used By | Notes |
| ---- | ------- | ----- |
| `PORT` | Backend | cPanel usually injects one; fall back to `4000` locally. |
| `APP_URL` | Backend | Public URL of the frontend (e.g., `https://app.example.com`). Used in payment callback URLs. |
| `JWT_SECRET` | Both | Must be a long random string; never check this into git. |
| `JWT_EXPIRES_IN` | Backend | Optional, defaults to `7d`. |
| `PAYSTACK_SECRET_KEY` | Backend | Needed if Paystack is enabled. |
| `STRIPE_SECRET_KEY` | Backend | Needed if Stripe is enabled. |
| `VITE_API_BASE_URL` | Frontend build | Should be the public API origin plus `/api`, e.g., `https://api.example.com/api`. |
| `VITE_PROXY_TARGET` | Frontend dev | Optional: overrides dev proxy target. |

## 3. Building artifacts locally
Run the helper script to build the frontend bundle and install production dependencies for the backend:

```bash
chmod +x scripts/cpanel-build.sh
./scripts/cpanel-build.sh
```

Results:
- `frontend/dist` contains the static SPA upload for cPanel.
- `server` holds the Node API; only install dependencies on the server (`npm ci --omit=dev`).

## 4. Deploying the frontend on cPanel
1. In **File Manager**, create a folder such as `public_html/app` (or use the document root of a subdomain).
2. Upload the contents of `frontend/dist` into that folder. You can zip the folder locally, upload, then extract via cPanel to save time.
3. Add an `.htaccess` file inside that folder so React Router routes resolve:

```apacheconf
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

4. When rebuilding, repeat the upload/extract. Update `VITE_API_BASE_URL` before running the build so the bundle points at the right API URL.

## 5. Deploying the backend (Node API) on cPanel
1. In cPanel, open **Setup Node.js App** → **Create Application**.
2. Choose the latest LTS Node version, set **Application root** to `/home/USER/server`, **Application URL** to something like `https://api.example.com`, and **Application startup file** to `src/index.js`.
3. After the app is created, open the terminal (or use the interface) and run:
   ```bash
   cd ~/server
   npm ci --omit=dev
   ```
4. Use the **Environment Variables** section to add the keys listed above (PORT is usually pre-filled by cPanel; match the same value in `VITE_API_BASE_URL`).
5. Click **Run NPM Script** → `start` (or run `npm start` over SSH). cPanel installs Passenger to keep the process alive.
6. Ensure the folder `server/src/data` is writable; lowdb stores `db.json` there. cPanel home directories are writable by default.

## 6. Connecting the two tiers
- If the API lives on `https://api.example.com`, set `VITE_API_BASE_URL=https://api.example.com/api` before running the frontend build.
- When hosting both tiers on the same apex domain, create a subdomain (e.g., `api.example.com`) for the backend to avoid mixed-content/CORS issues.
- The Vite dev server still proxies to `http://localhost:4000` via `/api`, so local development remains unchanged.

## 7. Post-deploy checklist
- `curl https://api.example.com/api` should return the JSON health payload defined in `server/src/index.js`.
- Browse to the frontend URL and confirm authentication flows succeed (network tab should show XHR requests hitting the API domain, not `/api`).
- Back up `server/src/data/db.json` regularly; this file is your persistent store on shared hosting.

## 8. Updating
1. Pull the latest code locally, re-run `./scripts/cpanel-build.sh`.
2. Upload the new `frontend/dist` bundle (overwrite existing files).
3. On the server, pull or upload the updated backend files, run `npm ci --omit=dev` if `package-lock.json` changed, then restart the Node app via cPanel.

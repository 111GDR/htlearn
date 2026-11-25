# Deploy HtLearn

Use this directory as the Git repository root. The deployment uses Vercel
for `client`, Render for `server`, MongoDB Atlas for data, and Cloudflare R2
for uploads. Docker is only needed for the existing local Docker workflow.

## 1. Push the repository

Create an empty private GitHub repository named `htlearn`. After the initial
local commit, run these commands from this directory, replacing the URL:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/htlearn.git
git push -u origin main
```

`.env*`, dependency directories, build output, TypeScript build caches, and
`server/uploads` are ignored. `.env.example` templates remain included.
Never commit real database credentials or API keys.

## 2. Create a new Atlas database

1. Create an Atlas project and cluster (free tier for the demo, if available).
2. Create database user `htlearn-app` with read/write access to `elearning`.
3. Add your current computer IP under Network Access for the one-time seed.
4. Copy the Node.js driver connection string and specify `elearning`:

```text
mongodb+srv://htlearn-app:ENCODED_PASSWORD@YOUR_CLUSTER.mongodb.net/elearning?retryWrites=true&w=majority
```

Percent-encode special characters in the password. Keep this URI on Render
and in the local seed process; never put it in Vercel frontend variables.

## 3. Configure R2

1. Activate Cloudflare R2 and create bucket `htlearn-uploads` with the default
   jurisdiction (the existing code uses the default S3 endpoint).
2. Enable the Public Development URL for the demo. Copy the HTTPS URL.
3. Create an R2 S3 API token with Object Read & Write permission restricted
   to that bucket. Save the Account ID, Access Key ID, and Secret Access Key.
4. Configure all five R2 values in Render in the next step. If any is absent,
   the app falls back to temporary local uploads, which Render does not retain.

Uploaded objects are public in this setup. For production, use an R2 custom
domain instead of the development `r2.dev` address. Activation can require a
payment method and usage beyond the included allowance can incur charges.

## 4. Deploy Render

In Render choose **New > Blueprint**, connect the GitHub repository, and use
the root `render.yaml`. It configures a Free Node service with:

| Setting | Value |
| --- | --- |
| Root directory | `server` |
| Node version | `22` |
| Build | `npm ci --include=dev && npm run build` |
| Start | `npm start` |
| Health path | `/api/health` |

The Blueprint generates `JWT_SECRET`. Fill in its prompted variables:

| Variable | Value |
| --- | --- |
| `MONGO_URI` | Atlas connection string |
| `CLIENT_URL` | `https://example.invalid` until Vercel is deployed |
| `APP_URL` | `https://example.invalid` until Vercel is deployed |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 S3 access key ID |
| `R2_SECRET_ACCESS_KEY` | R2 S3 secret key |
| `R2_BUCKET` | `htlearn-uploads` |
| `R2_PUBLIC_URL` | Public bucket HTTPS base URL, without a trailing slash |

Optionally add `GROQ_API_KEY` in Render after creation for AI features. Leave
the optional model variables unset to use the existing defaults.

From the service's **Connect > Outbound** tab, copy every outbound IP range
and add it to Atlas Network Access. The initial deployment may fail until
this is done; redeploy afterward. Check that
`https://YOUR_BACKEND.onrender.com/api/health` returns `{"ok":true,...}`.

The Free service sleeps after 15 idle minutes and can take about a minute
to wake. It blocks standard SMTP ports: leave SMTP variables unset for the
demo. Welcome/reset messages are logged instead of delivered. Use paid
compute and a supported SMTP provider for actual email delivery.

## 5. Seed the fresh demo database once

**This deletes users, courses, chapters, lessons, quizzes, enrollments, and
attempts in the target database. Only run against the new demo database.**

In a local PowerShell session:

```powershell
cd server
$env:MONGO_URI = 'YOUR_ATLAS_CONNECTION_STRING'
try {
  npm.cmd run seed
} finally {
  Remove-Item Env:MONGO_URI
}
```

The local environment variable overrides the dotenv MongoDB default. Do not
add seeding to Render startup or build commands. Remove your computer IP
from Atlas when local access is no longer needed.

| Role | Email | Initial password |
| --- | --- | --- |
| Admin | `admin@HtLearn.edu` | `admin123` |
| Teacher | `mohammed@HtLearn.edu` | `teacher123` |
| Teacher | `taha@HtLearn.edu` | `teacher123` |
| Student | `aymane@HtLearn.edu` | `student123` |

Change all four passwords before sharing the demo publicly. These accounts
are not forced through a password change by the seed script.

## 6. Deploy Vercel

Import the same GitHub repository as a Vercel project:

| Setting | Value |
| --- | --- |
| Framework | Vite |
| Root directory | `client` |
| Install | `npm ci` |
| Build | `npm run build` |
| Output | `dist` |
| Node version | `22.x` |
| Production environment variable | `VITE_API_URL=https://YOUR_BACKEND.onrender.com/api` |

The `/api` suffix is required. This variable is public and baked into the
frontend at build time: redeploy after changing it. Other service secrets
belong exclusively on Render. The included `client/vercel.json` provides
React Router deep-link fallback. API calls and uploads go directly to Render.

After Vercel deploys, update **both** Render URL variables to the exact
production frontend origin, e.g. `https://YOUR_FRONTEND.vercel.app`, without
a trailing slash. Save and redeploy Render. Preview origins are not allowed
by the current single-origin CORS configuration. Repeat this update if you
switch to a custom frontend domain.

For local development, leave `VITE_API_URL` unset to keep the Vite `/api`
proxy. `client/.env.example` documents the hosted setting; do not copy the
placeholder value into an active local environment file.

## 7. Verify

- Render `/api/health` responds.
- Vercel lists the seeded courses and login works for each role.
- Refreshing `/dashboard` works after login.
- A student can enroll, read a lesson, and complete a practice quiz.
- A teacher can upload an image and PDF; returned URLs point to R2.
- Uploaded files still load after restarting Render.
- AI features work when Groq is configured.

| Symptom | Check |
| --- | --- |
| Backend fails to start | Render logs, Atlas URI, and Atlas IP access list |
| CORS error | Exact production origin in Render `CLIENT_URL` |
| API calls hit Vercel | `VITE_API_URL` and a fresh Vercel deployment |
| Page refresh 404 | Vercel root `client` and included `vercel.json` |
| Upload returns `/uploads/...` | All five R2 values on Render |
| First request is slow | Free Render service waking up |

## Known application limitations

Deployment does not fix exam answer exposure through the answer-check
endpoint, the client-controlled final exam timer, or missing lesson/course
validation when recording progress. Address those separately before using
the site for real graded assessments.

## Provider references

- [Vercel Vite routing](https://vercel.com/docs/frameworks/frontend/vite)
- [Render Blueprint configuration](https://render.com/docs/blueprint-spec)
- [Render outbound IPs](https://render.com/docs/outbound-ip-addresses)
- [Render Free limitations](https://render.com/docs/free)
- [Atlas connections](https://www.mongodb.com/docs/atlas/connect-to-database-deployment/)
- [R2 authentication](https://developers.cloudflare.com/r2/api/tokens/)
- [R2 public buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/)

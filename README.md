# LARISIN

LARISIN is a shop-management prototype for Indonesian warungs and UMKM businesses.
It combines inventory, sales, finance, forecasting, notifications, chatbot assistance,
AI insights, and CSV exports.

## Features

- Email/password authentication with shop-scoped data.
- Product inventory with SKU, barcode, expiry date, minimum stock, and unit support.
- Quick Scan and manual sales entry.
- Finance transactions, components, history, and CSV export.
- Sales dashboard with weekly analytics and AI insights.
- Forecast-based restock recommendations.
- Rule-based fallback chatbot and Gemini/Vertex AI integration.
- Public UMKM market-trend search through a separate AI agent.
- Notification read and dismiss state.

## Repository Layout

```text
backend/       Go API, SQLite persistence, auth, domain handlers, ADK AI service
frontend/      Next.js App Router application
train/         Forecast training data and scripts
k8s/           Prototype Kubernetes resources
docs/          API, ERD, architecture, and technical documentation
```

## Requirements

- Go 1.26 or newer.
- Node.js 22 or newer.
- npm.
- PowerShell on Windows or an equivalent shell.
- Google Cloud CLI and ADC only if Gemini/Vertex AI is enabled.

## Installation

Clone the repository, then install frontend dependencies:

```powershell
cd frontend
npm ci
cd ..
```

The backend uses SQLite and creates `backend/larisin.db` automatically when started.
Schema creation, migrations, and prototype seed data run during startup.

## Run Locally

Open two terminals.

Terminal 1, backend:

```powershell
cd backend
go run ./cmd/server
```

Backend URL: `http://localhost:8080`

Terminal 2, frontend:

```powershell
cd frontend
npm run dev
```

Frontend URL: `http://localhost:3000`

The frontend rewrites `/api/v1/*` to `http://localhost:8080/api/v1/*` by default.
For another backend URL, set `INTERNAL_BACKEND_URL` before `npm run build`.

## Demo Account

Prototype seed account:

```text
Email:    zafran@larisin.id
Password: larisin123
```

Demo credentials are development-only. Disable demo seeding before production use.

## Local AI With Vertex ADC

Do not put API keys in source code, frontend variables, Docker images, or Git.
For local Vertex AI access, authenticate with Application Default Credentials:

```powershell
gcloud auth application-default login
gcloud config set project hology-67
gcloud services enable aiplatform.googleapis.com

$env:AI_ENABLED = "true"
$env:AI_AUTH_MODE = "vertex"
$env:GOOGLE_CLOUD_PROJECT = "hology-67"
$env:GOOGLE_CLOUD_LOCATION = "global"
$env:GEMINI_MODEL = "gemini-3.1-flash-lite"
$env:AI_MARKET_SEARCH_ENABLED = "true"

cd backend
```

Expected startup logs:

```text
AI service enabled with model gemini-3.1-flash-lite
AI market search enabled: true
```

The chatbot falls back to rule-based Ari when AI is disabled or unavailable.

## Environment Test

Run these checks before local development:

```powershell
go version
node --version
npm --version
Test-Path .\backend\larisin.db
Test-Path .\backend\internal\forecast\model.json
```

Check backend health:

```powershell
Invoke-RestMethod http://localhost:8080/api/v1/health
```

Check ADC without printing the access token:

```powershell
$null = gcloud auth application-default print-access-token 2>$null
$LASTEXITCODE
```

Expected ADC result is `0`.

## Verification Commands

Backend:

```powershell
cd backend
go test ./...
go vet ./...
go build ./...
```

Frontend:

```powershell
cd frontend
npm run build
npm run lint
```

The repository currently has five known baseline ESLint errors in dashboard, finance,
and transaction-modal code. Frontend production build passes.

## Docker

Build backend:

```powershell
docker build -t larisin-backend -f backend/Dockerfile backend
```

Build frontend:

```powershell
docker build -t larisin-frontend -f frontend/Dockerfile frontend
```

The frontend backend rewrite target is compiled into the Next.js build. Supply
`INTERNAL_BACKEND_URL` during the frontend build for non-local deployments.

## Kubernetes Prototype

Current resources are in `k8s/deployment.yaml`:

```powershell
kubectl apply -f k8s/deployment.yaml
```

Current manifest uses one backend replica, SQLite on a PVC, mutable `latest` images,
and a public LoadBalancer. Add HTTPS, secrets, probes, resource limits, immutable
image digests, and backups before production deployment.

## Documentation

- [API documentation](docs/API.md)
- [Entity relationship diagram](docs/ERD.md)
- [System architecture](docs/ARCHITECTURE.md)
- [Technical operations guide](docs/TECHNICAL.md)

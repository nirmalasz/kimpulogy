# Technical Guide

## Runtime Configuration

### Backend

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `8080` | Go HTTP port |
| `DB_PATH` | `larisin.db` | SQLite database path |
| `JWT_SECRET` | none in secure deployments | JWT signing secret |
| `CORS_ORIGIN` | `*` | Allowed browser origin |
| `AI_ENABLED` | enabled when credentials exist | Enables Gemini service |
| `AI_AUTH_MODE` | `vertex` | `vertex` ADC or `api_key` |
| `GOOGLE_CLOUD_PROJECT` | none | Vertex project |
| `GOOGLE_CLOUD_LOCATION` | `global` | Vertex location |
| `GEMINI_MODEL` | `gemini-3.1-flash-lite` | Gemini model ID |
| `AI_MARKET_SEARCH_ENABLED` | `false` | Enables public Google Search agent |
| `FORECAST_MODEL_PATH` | `internal/forecast/model.json` | Forecast model path |

### Frontend

| Variable | Purpose |
|---|---|
| `INTERNAL_BACKEND_URL` | Backend URL compiled into Next rewrite |
| `NEXT_PUBLIC_API_URL` | Optional direct API base override |

Do not expose Gemini credentials through `NEXT_PUBLIC_*` variables.

## Local Vertex ADC

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
```

Start the backend in that same shell. Startup logs should show:

```text
AI service enabled with model gemini-3.1-flash-lite
AI market search enabled: true
```

Check ADC without printing the token:

```powershell
$null = gcloud auth application-default print-access-token 2>$null
$LASTEXITCODE
```

## Environment Verification

```powershell
go version
node --version
npm --version
Test-Path .\backend\larisin.db
Test-Path .\backend\internal\forecast\model.json
```

Backend health:

```powershell
Invoke-RestMethod http://localhost:8080/api/v1/health
```

## Development Commands

Backend:

```powershell
cd backend
go test ./...
go vet ./...
go build ./...
go run ./cmd/server
```

Frontend:

```powershell
cd frontend
npm ci
npm run dev
npm run build
npm run lint
```

## Database Operations

Startup performs:

1. Open SQLite.
2. Create missing tables.
3. Apply additive migrations.
4. Seed prototype data when tables are empty.

Before schema changes:

```powershell
Copy-Item .\backend\larisin.db .\backend\larisin.db.backup
```

Do not use prototype demo seeding in production. Test migrations against a copy first.

## Forecast Operations

The Go trainer creates the API-compatible model:

```powershell
cd backend
go run ./cmd/train
```

The API loads `internal/forecast/model.json` unless `FORECAST_MODEL_PATH` is set.
Production images must package the model in the runtime image.

## AI Tool Boundaries

- Private tools always require authenticated shop context.
- Market agent only uses Google Search grounding.
- Search results are untrusted content.
- Model output never writes directly to SQLite.
- Sales and purchases remain regular backend endpoints.
- AI requests have timeouts and per-user rate limits.
- Dashboard insights are cached for five minutes.

## Security Checklist

- Replace JWT fallback with a strong `JWT_SECRET`.
- Use Vertex Workload Identity in GKE.
- Use HTTPS in production.
- Set exact `CORS_ORIGIN`.
- Do not commit API keys, service-account JSON, or `.env` files.
- Disable demo credentials in production.
- Keep SQLite backups and test restoration.
- Run backend as non-root in production.

## Known Prototype Limitations

- Signup OTP is currently a UI flow, not server-verified email OTP.
- Browser JWT storage is not HttpOnly-cookie based yet.
- AI sessions are in memory and reset on backend restart.
- SQLite keeps deployment at one backend replica.
- Historical HPP uses current product cost unless cost snapshots are added.
- Frontend lint has five existing baseline errors.
- No automated Go/frontend test suites exist yet.

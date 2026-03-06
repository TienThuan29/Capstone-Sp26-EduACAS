# Edu-ACAS Scripts

## Database reset and seed (1-click)

Resets all DynamoDB tables used by AcasService and re-seeds them with realistic mock data. **Only available when the service runs in Development.**

### How it works

- **Auto-discovery:** The reset service uses C# Reflection to find all classes in `AcasService.Models` marked with `[DynamoDBEntity("...")]`. Table names are read from `appsettings.json` (e.g. `DynamoDB:SubmissionTableName`).
- **Wipe:** For each table, items are scanned (key-only), then deleted in batches of 25 via `BatchWriteItemAsync` (DynamoDB limit).
- **Seed:** Bogus generates fake but consistent data. Submissions reference only generated StudentIds, ExamIds, ProblemIds, and LanguageIds so logical integrity is preserved.

### Prerequisites

1. AcasService running in **Development** (`ASPNETCORE_ENVIRONMENT=Development`).
2. Default base URL: `http://localhost:8002` (override with `ACAS_BASE_URL` if needed).

### Usage

**Option 1 – Shell script (recommended)**

```bash
# From repo root or servers/scripts
chmod +x servers/scripts/reset-db.sh
./servers/scripts/reset-db.sh
```

**Option 2 – curl**

```bash
curl -X POST http://localhost:8002/api/dev/reset-db -H "Content-Type: application/json"
```

**Option 3 – Swagger**

When running in Development, open Swagger (`http://localhost:8002/swagger`) and call `POST /api/dev/reset-db`.

### Security

- The endpoint **only runs when `IWebHostEnvironment.IsDevelopment()` is true**. In Staging/Production it returns **403 Forbidden**.
- No authentication is required for this dev endpoint; keep the service in Development only on local or trusted dev environments.

### Response

- **200 OK:** `{ "success": true, "tablesWiped": 12, "itemsSeeded": 150, "message": "..." }`
- **403:** Not in Development.
- **500:** Wipe or seed failed (check logs).

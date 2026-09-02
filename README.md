# Infera ITMS

Jira benzeri, Clean Architecture (ASP.NET Core 10 + React) ile geliştirilmiş proje/görev yönetim sistemi.

## Gereksinimler

- .NET 10 SDK
- Node.js 20+
- Docker (Postgres/Redis/MinIO için)

## Kurulum

### 1. Bağımlılık servislerini başlat

```bash
docker compose up -d
```

Bu, Postgres (5432), Redis (6379) ve MinIO (9000/9001) container'larını ayağa kaldırır.

MinIO konsoluna (`http://localhost:9001`, `minioadmin` / `minioadmin123`) girip **`infera-uploads`** adında bir bucket oluştur.

### 2. Backend

```bash
cd backend/src/Infera.Api
cp appsettings.Example.json appsettings.json
# appsettings.json içindeki Jwt:Secret değerini gerçek bir rastgele değerle değiştir
dotnet ef database update --project ../Infera.Infrastructure --startup-project .
dotnet run
```

API `http://localhost:5148` üzerinde, Swagger `http://localhost:5148/swagger` üzerinde, Hangfire dashboard `http://localhost:5148/hangfire` üzerinde (yalnızca Admin) çalışır.

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend `http://localhost:5173` üzerinde çalışır.

### 4. Varsayılan hesap

İlk çalıştırmada seed edilen Admin hesabı:
- E-posta: `admin@infera.local`
- Şifre: `Admin123!`

## Testler

```bash
cd backend
dotnet test
```

## Mimari

- **Backend:** ASP.NET Core, Clean Architecture (Domain/Application/Infrastructure/Api), CQRS (MediatR), EF Core + PostgreSQL
- **Frontend:** React + TypeScript, Vite, TanStack Query, Tailwind CSS
- **Gerçek zamanlı:** SignalR
- **Arka plan işleri:** Hangfire (PostgreSQL storage)
- **Cache:** Redis (opsiyonel — erişilemezse sistem cache'siz çalışmaya devam eder)
- **Dosya depolama:** S3-uyumlu (MinIO lokal, prod'da AWS S3/Azure Blob)
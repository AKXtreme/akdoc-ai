# AKDoc AI

An AI-powered document processing platform that automatically extracts structured data from invoices, receipts, and other financial documents using Google Gemini AI.

Upload a PDF or image, and AKDoc AI reads it, pulls out every important field (vendor, date, line items, totals, tax), and gives you a searchable, exportable dashboard — no manual data entry required.

---

## What it does

- **Automatic extraction** — upload any invoice or receipt (PDF, JPG, PNG) and Gemini AI extracts vendor name, invoice number, date, line items, tax, and total amount
- **Document dashboard** — view all your documents with live status, sortable columns, advanced filters (date range, amount range, company), and full-text search
- **Bulk operations** — select multiple documents, bulk delete, or export all extracted data to CSV
- **Analytics** — charts showing monthly spend trends, top vendors, document volume, and processing success rates
- **User accounts** — JWT authentication, profile management, role-based access (admin / regular user)
- **Admin panel** — manage users, view system-wide document stats
- **Live updates** — documents poll automatically while processing; status updates without page refresh
- **Dark mode** — full light/dark theme, remembered across sessions
- **Email notifications** — get emailed when a document finishes processing or fails (optional, requires SMTP)
- **Keyboard shortcuts** — `u` upload, `/` search, `g d` dashboard, `g l` documents list, `?` help
- **Mobile responsive** — works on phones and tablets; sidebar collapses into a slide-out drawer

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Redux Toolkit, Recharts, lucide-react |
| Backend | FastAPI, SQLAlchemy, Pydantic v2 |
| Database | PostgreSQL 15 |
| AI | Google Gemini API |
| Auth | JWT (python-jose) + bcrypt |
| Container | Docker + Docker Compose |

---

## Quick start (Docker — recommended)

This is the easiest way to run the full stack locally. You only need Docker Desktop installed.

### 1. Clone the repo

```bash
git clone https://github.com/AKXtreme/akdoc-ai.git
cd akdoc-ai
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```env
# Required — generate a strong random string (min 32 chars)
SECRET_KEY=replace-this-with-a-strong-random-secret

# Required — get your free key at https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your-gemini-api-key-here

# Optional — fill in to enable email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=you@gmail.com
```

> **Gmail tip:** use an [App Password](https://myaccount.google.com/apppasswords), not your main password.

### 3. Start everything

```bash
cd docker
docker compose up --build
```

First run takes 2–3 minutes to build the images. After that:

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API docs (Swagger) | http://localhost:8000/docs |

### 4. Create your account

Open http://localhost:3000, click **Sign up**, and register. The first user automatically gets admin access.

---

## Manual setup (without Docker)

If you prefer to run services directly on your machine:

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+

### Database

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE akdoc_db;"
psql -U postgres -c "CREATE USER akdoc WITH PASSWORD 'akdoc_pass';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE akdoc_db TO akdoc;"
```

### Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables (copy and edit .env at project root first)
export $(cat ../.env | xargs)

# Run the server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
REACT_APP_API_URL=http://localhost:8000/api/v1 npm start
```

Open http://localhost:3000.

---

## Project structure

```
akdoc-ai/
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy models (User, Document, ExtractionResult)
│   │   ├── routers/         # FastAPI route handlers (auth, documents, admin, analytics)
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── services/        # AI extraction, email service
│   │   └── main.py          # App entry point
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/      # React components (Layout, Dashboard, Documents, Auth, Profile)
│   │   ├── store/           # Redux slices (auth, documents)
│   │   ├── hooks/           # Custom hooks (useBreakpoint, useKeyboardShortcuts)
│   │   └── services/        # Axios API client
│   └── Dockerfile
├── docker/
│   └── docker-compose.yml
├── database/
│   └── init.sql
├── .env.example
└── README.md
```

---

## Environment variables reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `SECRET_KEY` | Yes | — | JWT signing secret (min 32 chars) |
| `GEMINI_API_KEY` | Yes | — | Google Gemini API key |
| `UPLOAD_DIR` | No | `./uploads` | Where uploaded files are stored |
| `MAX_FILE_SIZE` | No | `10485760` | Max upload size in bytes (default 10 MB) |
| `ALLOWED_ORIGINS` | No | `["http://localhost:3000"]` | CORS allowed origins |
| `SMTP_HOST` | No | — | SMTP server hostname |
| `SMTP_PORT` | No | `587` | SMTP port |
| `SMTP_USER` | No | — | SMTP login username |
| `SMTP_PASSWORD` | No | — | SMTP login password |
| `SMTP_FROM` | No | `noreply@akdoc.ai` | From address for notification emails |

---

## How to use

### Uploading documents

1. Click **Upload** in the sidebar or press `u`
2. Drag and drop files or click to browse — supports PDF, JPG, PNG
3. Upload multiple files at once; each shows individual progress
4. Documents go into a **Processing** state while Gemini extracts the data (usually 5–15 seconds)
5. Status updates live — no need to refresh

### Viewing extracted data

Click any document to open the detail view:
- All extracted fields (vendor, invoice number, date, line items, tax, total)
- Confidence breakdown per field
- Original document preview (images inline, PDFs in an embedded viewer)
- Raw OCR text
- Processing audit log

### Searching and filtering

On the Documents page:
- **Search** — press `/` or type in the search box to filter by filename or company name
- **Status filter** — show only pending / processing / completed / failed
- **Date range** — filter by upload date
- **Amount range** — filter by extracted total amount
- **Sort** — click any column header to sort ascending or descending

### Exporting data

- Click **Export CSV** on the Documents page to download all currently filtered documents as a spreadsheet
- Each row includes filename, status, company, invoice number, date, subtotal, tax, and total

### Admin panel

Admin users can access `/admin` from the sidebar:
- View all registered users
- Activate / deactivate accounts
- See document counts per user

---

## Stopping the app

```bash
# Stop containers (keeps data)
docker compose down

# Stop and delete all data (database + uploads)
docker compose down -v
```

---

## Common issues

**Port already in use**
```bash
# Find and kill what is using port 3000 or 8000
lsof -ti:3000 | xargs kill
lsof -ti:8000 | xargs kill
```

**Gemini API errors**
- Make sure `GEMINI_API_KEY` in `.env` is valid
- The free tier allows 15 requests/minute — heavy uploads may hit this limit

**Database connection refused**
- On first run, the backend starts before the database is ready; Docker Compose retries automatically
- If running manually, make sure PostgreSQL is running and `DATABASE_URL` is correct

**File uploads failing**
- Check `MAX_FILE_SIZE` — default is 10 MB
- Only PDF, JPG, and PNG are supported

---

## License

MIT

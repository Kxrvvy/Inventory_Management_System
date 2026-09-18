# Puppet's Directory — Backend

Inventory and Point-of-Sale management system for **Sampayan ni Puppet**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | FastAPI |
| ORM | SQLAlchemy (async) |
| Database | PostgreSQL 18 |
| Driver | asyncpg (app), psycopg2 (migrations) |
| Migrations | Alembic |
| Auth | JWT via python-jose |
| Password Hashing | bcrypt via passlib |
| Config | pydantic-settings |

---

## Project Structure

```
backend/
├── app/
│   ├── api/                  # API route files (one per module)
│   ├── models/               # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── product.py
│   │   ├── product_variant.py
│   │   ├── transaction.py
│   │   ├── sales_invoice.py
│   │   └── restock_history.py
│   ├── schemas/              # Pydantic schemas (request/response)
│   ├── utils/
│   │   ├── config.py         # App settings via pydantic-settings
│   │   └── security.py       # Password hashing, JWT
│   ├── database.py           # Async engine, session, Base
│   ├── dependencies.py       # get_db, get_current_user, require_admin
│   └── main.py               # FastAPI app entry point
├── alembic/                  # Migration files
├── alembic.ini               # Alembic configuration
├── requirements.txt
└── .env                      # Environment variables (not committed to git)
```

---

## PostgreSQL Installation (First Time Setup)

Every team member needs PostgreSQL installed on their machine before running the project.

### Windows

1. Download PostgreSQL 18 from: https://www.postgresql.org/download/windows/
2. Run the installer
3. During installation:
   - Keep the default port: `5432`
   - Set a password for the `postgres` user — **remember this password**, you will need it for your `.env` file
   - Keep all default components (includes pgAdmin)
4. Finish installation and open **pgAdmin 4** from the Start menu
5. In pgAdmin, expand **Servers → PostgreSQL 18 → Databases**
6. Right click **Databases → Create → Database**
7. Name it `puppets_directory` and click **Save**

### If you forget your PostgreSQL password

1. Open `C:\Program Files\PostgreSQL\18\data\pg_hba.conf` as Administrator in Notepad
2. Find these lines near the bottom:
```
host    all    all    127.0.0.1/32    scram-sha-256
host    all    all    ::1/128         scram-sha-256
```
3. Change `scram-sha-256` to `trust` on both lines and save
4. Open **Services** in Start menu, find `postgresql-x64-18`, right click → **Restart**
5. Open terminal and run:
```bash
psql -U postgres
```
6. Inside psql run:
```sql
ALTER USER postgres WITH PASSWORD 'yournewpassword';
\q
```
7. Go back to `pg_hba.conf`, revert `trust` back to `scram-sha-256`, save and restart the service again

------------------------------------------------------------

## Setup Instructions

### 1. Clone the repository
```bash
git clone <repo-url>
cd backend
```

### 2. Create and activate virtual environment
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Create `.env` file
Create a `.env` file in the `backend/` root folder:
```
DATABASE_URL=postgresql+asyncpg://postgres:yourpassword@localhost:5432/puppets_directory
SECRET_KEY=your-generated-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
```

Replace `yourpassword` with the password you set during PostgreSQL installation.

To generate a SECRET_KEY:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### 5. Run migrations
This will create all the tables in your local `puppets_directory` database automatically:
```bash
D
```

You should see:
```
INFO  [alembic.runtime.migration] Running upgrade  -> xxxxxxxx, initial schema
```

Verify in pgAdmin by expanding:
```
puppets_directory → Schemas → public → Tables
```
You should see all 6 tables: `users`, `products`, `product_variants`, `transactions`, `sales_invoices`, `restock_history`

### 6. Start the server
```bash
uvicorn app.main:app --reload
```

API will be available at: `http://localhost:8000`
Swagger docs at: `http://localhost:8000/docs`

--------------------------------------------------------------------------------

## Database Schema

### Users
| Column | Type | Description |
|---|---|---|
| user_id | INT (PK) | Unique user ID |
| username | VARCHAR(50) | Login name, unique |
| email | VARCHAR(100) | Email, unique |
| password | VARCHAR(255) | Hashed password |
| role | VARCHAR(50) | `admin` or `staff` |
| created_at | DATETIME | Account creation timestamp |

### Products
| Column | Type | Description |
|---|---|---|
| product_id | INT (PK) | Unique product ID |
| item_name | VARCHAR(150) | Product name |
| category | VARCHAR(150) | Product category |
| base_price | FLOAT | Base price |
| image_url | VARCHAR(500) | Optional image URL |
| status | VARCHAR(50) | `active` or `inactive` |

### Product Variants
| Column | Type | Description |
|---|---|---|
| variant_id | INT (PK) | Unique variant ID |
| product_id | INT (FK) | References products |
| size | VARCHAR(50) | e.g. S, M, L, XL |
| color | VARCHAR(50) | e.g. Black, White |
| stock_threshold | INT | Low-stock alert trigger |
| quantity_in_stock | INT | Current stock level |

### Transactions
| Column | Type | Description |
|---|---|---|
| transaction_id | INT (PK) | Unique transaction ID |
| user_id | INT (FK) | References users (staff) |
| payment_method | VARCHAR(50) | e.g. Cash, GCash |
| total_amount | FLOAT | Total transaction amount |
| purchased_at | DATETIME | Transaction timestamp |

### Sales Invoices
| Column | Type | Description |
|---|---|---|
| invoice_id | INT (PK) | Unique invoice ID |
| transaction_id | INT (FK) | References transactions |
| variant_id | INT (FK) | References product_variants |
| quantity_sold | INT | Units sold |
| unit_price | FLOAT | Price locked at time of sale |

### Restock History
| Column | Type | Description |
|---|---|---|
| restock_id | INT (PK) | Unique restock ID |
| variant_id | INT (FK) | References product_variants |
| user_id | INT (FK) | References users (who restocked) |
| quantity_added | INT | Units added to stock |
| restock_date | DATETIME | Restock timestamp |

---

## Role-Based Access Control

| Feature | Admin | Staff |
|---|---|---|
| Login | ✅ | ✅ |
| POS / Process Sales | ✅ | ✅ |
| View Inventory | ✅ | ✅ |
| Manage Products (CRUD) | ✅ | ❌ |
| Manage User Accounts | ✅ | ❌ |
| Financial Reports | ✅ | ❌ |
| Admin Dashboard | ✅ | ❌ |
| Configure Low-Stock Alerts | ✅ | ❌ |

---

## Migrations

To create a new migration after changing a model:
```bash
alembic revision --autogenerate -m "describe your change"
alembic upgrade head
```

To rollback one version:
```bash
alembic downgrade -1
```

---

## Requirements

```
fastapi
uvicorn[standard]
sqlalchemy
asyncpg
psycopg2-binary
alembic
python-jose[cryptography]
bcrypt==4.0.1
passlib==1.7.4
python-multipart
pydantic
pydantic-settings
```

---

## Team

| Name | Role |
|---|---|
| Acoba, Godwin Kirby L. | Backend |
| Castro, Ashton Zaki M. | Backend |
| Maraña, Fiona Hailey L. | |
| Mercado, Caiyl Martin M. | |
| Sison, Stephanie Keith F. | |

---

## Progress

- [x] Project structure setup
- [x] Database configuration (PostgreSQL + SQLAlchemy async)
- [x] All 6 models created
- [x] Alembic migrations — initial schema applied
- [ ] Security (password hashing, JWT)
- [ ] Dependencies (get_current_user, require_admin)
- [ ] main.py setup
- [ ] API routes
- [ ] Schemas (Pydantic)
- [ ] Frontend integration
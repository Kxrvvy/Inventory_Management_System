<div align="center">

<img src="frontend/src/assets/logo.png" width="120" alt="Puppet's Directory logo" />

# Puppet's Directory 🐶👕
**Inventory & Point-of-Sale System for *Sampayan ni Puppet***

A full-stack web app for tracking apparel stock, managing product variants, and processing sales in one place.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-black?logo=fastapi)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1?logo=postgresql&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-black?logo=vite)
![Status](https://img.shields.io/badge/status-completed-brightgreen)

</div>

---

## 📖 About

**Sampayan ni Puppet** needed a single source of truth for two things that used to live in separate spreadsheets: what's in stock, and what's being sold. Puppet's Directory brings both into one app — a cashier-facing POS screen for ringing up sales, and an admin side for managing inventory, staff accounts, and sales reports.

It was built as a school group project, and is now feature-complete.

## ✨ Features

- 🛒 **Point of Sale** — browse products, build a cart, and check out by size/color variant
- 📦 **Inventory Management** — full CRUD on products and variants, with low-stock threshold alerts
- 📊 **Admin Dashboard** — sales trends, top-selling products, and recent activity at a glance
- 🧾 **Sales & Restock History** — every transaction and restock is logged and traceable
- 👥 **Staff Management** — add/remove staff accounts with role-based permissions
- 🔐 **Role-Based Access Control** — admins get full access; staff get POS + inventory viewing only
- 📈 **Financial Reports** — generated from real transaction data

## 🖼️ Screenshots

<table>
<tr>
<td width="50%" align="center">
<img src="docs/screenshots/Login.png" width="100%" alt="Login screen" />
<b>Login</b>
</td>
<td width="50%" align="center">
<img src="docs/screenshots/POS.png" width="100%" alt="POS dashboard" />
<b>Point of Sale</b>
</td>
</tr>
<tr>
<td width="50%" align="center">
<img src="docs/screenshots/AdminDashboard.png" width="100%" alt="Admin dashboard with sales chart" />
<b>Admin Dashboard</b>
</td>
<td width="50%" align="center">
<img src="docs/screenshots/Inventory.png" width="100%" alt="Inventory table" />
<b>Inventory Management</b>
</td>
</tr>
<tr>
<td width="50%" align="center">
<img src="docs/screenshots/SalesAnalytics.png" width="100%" alt="Sales analytics page" />
<b>Sales Analytics</b>
</td>
<td width="50%" align="center">
<img src="docs/screenshots/Staff.png" width="100%" alt="Staff management page" />
<b>Staff Management</b>
</td>
</tr>
</table>

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TailwindCSS |
| Backend | FastAPI, SQLAlchemy (async) |
| Database | PostgreSQL 18 |
| Auth | JWT (python-jose) + bcrypt |
| Migrations | Alembic |
| Charts | Recharts |

## 📂 Project Structure

```
Puppet-s-Directory/
├── backend/
│   ├── app/
│   │   ├── api/            # Route handlers (one file per module)
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic request/response schemas
│   │   ├── utils/          # Config, security (hashing, JWT)
│   │   ├── database.py     # Async engine + session
│   │   ├── dependencies.py # get_db, get_current_user, require_admin
│   │   └── main.py         # FastAPI entry point
│   ├── alembic/             # DB migrations
│   └── requirements.txt
└── frontend/
    └── src/
        ├── Features/
        │   ├── Admin/       # Dashboard, Inventory, Staff, Reports
        │   ├── POS/         # Cashier-facing point of sale
        │   └── login.jsx
        └── main.jsx
```

## 🗄️ Database Schema

| Table | Purpose |
|---|---|
| `users` | Accounts with `admin` / `staff` roles |
| `products` | Base product catalog |
| `product_variants` | Size/color variants with stock levels + low-stock threshold |
| `transactions` | One row per sale, tied to the staff member who processed it |
| `sales_invoices` | Line items for each transaction |
| `restock_history` | Log of every stock replenishment |

## 🔐 Role-Based Access

| Feature | Admin | Staff |
|---|:---:|:---:|
| POS / Process Sales | ✅ | ✅ |
| View Inventory | ✅ | ❌ |
| Manage Products (CRUD) | ✅ | ❌ |
| Manage User Accounts | ✅ | ❌ |
| Financial Reports | ✅ | ❌ |
| Admin Dashboard | ✅ | ❌ |

## 🔑 Default Admin Credentials

After running the seed script (see Step 2 below), you can log in with:

| Field | Value |
|---|---|
| Username | `admin` |
| Email | `admin@puppetsdirectory.com` |
| Password | `admin123` |

> ⚠️ These are development/demo credentials only — change them before using this anywhere beyond local testing.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL 18 ([Windows installer](https://www.postgresql.org/download/windows/))

### 1. Clone the repo
```bash
git clone https://github.com/Kxrvvy/Puppet-s-Directory.git
cd Puppet-s-Directory
```

### 2. Backend setup
```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:
```
DATABASE_URL=postgresql+asyncpg://postgres:yourpassword@localhost:5432/puppets_directory
SECRET_KEY=your-generated-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
```

Generate a secret key with:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Run migrations, seed the admin account, and start the server:
```bash
alembic upgrade head
python seed.py
uvicorn app.main:app --reload
```
- API: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
```

## 🛠️ Troubleshooting

**Forgot your PostgreSQL password?**

1. Open `C:\Program Files\PostgreSQL\18\data\pg_hba.conf` as Administrator in Notepad
2. Find these lines near the bottom and change `scram-sha-256` to `trust`:
   ```
   host    all    all    127.0.0.1/32    scram-sha-256
   host    all    all    ::1/128         scram-sha-256
   ```
3. Restart the `postgresql-x64-18` service (Start menu → Services)
4. In a terminal:
   ```bash
   psql -U postgres
   ALTER USER postgres WITH PASSWORD 'yournewpassword';
   \q
   ```
5. Revert `pg_hba.conf` back to `scram-sha-256` and restart the service again

**Migrations won't run / tables missing?**
Confirm the `puppets_directory` database actually exists in pgAdmin before running `alembic upgrade head` — Alembic won't create the database itself, only the tables inside it.

**Frontend can't reach the API?**
Make sure the backend is running on `localhost:8000` before starting `npm run dev` — the frontend expects it there by default.

## ✅ Development Checklist

**Phase 1 — Backend Foundations**
- [x] Project structure setup
- [x] Database configuration (PostgreSQL + SQLAlchemy async)
- [x] All 6 models created
- [x] Alembic migrations — initial schema applied
- [x] Security (password hashing, JWT)
- [x] Dependencies (`get_current_user`, `require_admin`)
- [x] `main.py` setup + API routes + Pydantic schemas

**Phase 2 — Frontend Integration**
- [x] Login page
- [x] POS screen (product grid, cart, checkout)
- [x] Admin dashboard (sales chart, low-stock alerts, recent activity)
- [x] Inventory management (CRUD + variants)
- [x] Staff management
- [x] Reports (daily / weekly / monthly)

**Phase 3 — Wrap-up**
- [x] Role-based access control end-to-end
- [x] Manual QA across admin + staff roles
- [x] Final submission

## 🌿 Git Workflow Guide

Branches followed the convention:
```
<feature-name>-v<major>.<minor>.<patch>
```
Examples: `login-v1.0.0`, `pos-checkout-v1.0.0`, `inventory-crud-v1.0.1`

```bash
# Create a feature branch
git checkout -b <feature-name>-v1.0.0

# Stage, commit, push
git add .
git commit -m "feat: implement <feature>"
git push origin <feature-name>-v1.0.0

# Merge back into main
git checkout main
git pull origin main
git merge <feature-name>-v1.0.0
git branch -d <feature-name>-v1.0.0
git push origin --delete <feature-name>-v1.0.0
```

## 👥 Team — Group 6

| Name | Role |
|---|---|
| Acoba, Godwin Kirby L. | Backend |
| Castro, Ashton Zaki M. | Backend |
| Maraña, Fiona Hailey L. | Frontend |
| Mercado, Caiyl Martin M. | Frontend |
| Sison, Stephanie Keith F. | Frontend |

## 📌 Status

This project is **complete**, built as a group project for *Sampayan ni Puppet*.

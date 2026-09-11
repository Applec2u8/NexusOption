# Nexus Option 📈

**Nexus Option** is a modern, responsive, and dynamic web application for stock, crypto, and commodity trading.

## 🚀 Key Features

- **Authentication Flow**: Secure login, registration, and OTP verification via Supabase Auth.
- **Real-time Market Data**: Track live prices for Cryptocurrencies, Stocks, and Commodities.
- **Trading System**: Buy and sell assets with real-time portfolio updates.
- **Comprehensive Wallet**:
  - Dynamic deposit interface with QR code generation.
  - 3-step withdrawal wizard with automatic validation.
  - Trade History filtering by categories (Crypto, Stock, Commodity).
- **Multi-language Support (i18n)**: Seamless switching between Thai (th) and English (en) with `localStorage` persistence.
- **Admin Dashboard**: Dedicated portal for administrators to manage users, update global settings (Support lines, Telegram), and monitor transactions.
- **Responsive UI**: Mobile-first design, optimized for seamless interaction across all devices using Framer Motion animations.

## 🛠️ Technology Stack

- **Frontend**: React (Vite), TypeScript, TailwindCSS
- **Design/Animations**: Framer Motion, Lucide React (Icons), Recharts
- **Backend/Database**: Supabase (PostgreSQL, Auth, RLS)
- **Routing**: React Router DOM

---

## ກ່ອນຈະພັດທະນາ ໃຫ້ກວດເບີ່ງກ່ອນ git pull ກ່ອນ

> git pull (ດືງໂຄ້ດຈາກກຶດມາອັບເດດກ່ອນ)

## Git Commit

git add .
git commit -m "ອັບເດດລະບົບ"
git push

git push -u origin main

---

## ⚙️ Getting Started & Installation

### 1. Prerequisites

Ensure you have the following installed on your machine:

- [Node.js](https://nodejs.org/en/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or yarn
- A [Supabase](https://supabase.com/) account.

### 2. Setup Supabase Database

Before running the application, you need to set up your database schema.

1. Create a new project in Supabase.
2. Go to the **SQL Editor**.
3. Copy the entire contents of `src/lib/supabase_schema.sql` and run it.
   _(This script is fully idempotent and will automatically create all necessary tables, policies, and triggers.)_

### 3. Configure Environment Variables

Create a `.env` file in the root directory of your project and add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Install Dependencies

Run the following command to install the required packages:

```bash
npm install
```

### 5. Run the Application

Start the development server:

```bash
npm run dev
```

The application will typically start on `http://localhost:5173`.

---

## 📂 Project Structure

- `/src/assets`: Images and static assets.
- `/src/components`: Reusable UI components (Modals, Forms, Charts).
- `/src/contexts`: React Contexts for global state (Auth, Wallet, Language).
- `/src/lib`: Configuration files including `supabase.ts` and `supabase_schema.sql`.
- `/src/pages`: Main application routes (Home, Trade, Wallet, Settings, Admin).

---

## 🔒 Admin Access

To access the Admin panel, a user account must have its `is_admin` boolean flag set to `true` (or `role` set to `'admin'`) in the Supabase `profiles` table. Once set, the user can navigate to the `/admin` route or click the "Admin Dashboard" button in their settings.

---
# Nexus Option


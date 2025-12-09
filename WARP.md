# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Bizz Co Hub is an e-commerce platform built with Next.js 14 for selling refurbished laptops, computers, and accessories. The application includes a customer-facing storefront and an admin panel for product and order management.

**Tech Stack:**
- **Framework:** Next.js 14 (App Router, TypeScript, React 18)
- **Database:** Neon Postgres (serverless) via `@neondatabase/serverless`
- **ORM:** Drizzle ORM (installed but raw SQL queries are used in practice)
- **Image Storage:** ImageKit CDN
- **Email:** SMTP via Nodemailer
- **Styling:** Custom CSS (no framework)
- **Animations:** Framer Motion, OGL for WebGL effects

## Development Commands

### Core Commands
```powershell
# Install dependencies
npm install

# Start development server (runs on port 3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

### Environment Setup
```powershell
# Copy environment template and configure
Copy-Item .env.example .env.local

# Update ImageKit credentials (PowerShell script)
.\update-imagekit-env.ps1
```

### Database Operations
Database migrations are manual SQL files in the `/migrations` directory. Run them directly in the Neon database console.

Required environment variables:
- `POSTGRES_URL` or `DATABASE_URL` - Neon connection string
- `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY` - ImageKit public key
- `IMAGEKIT_PRIVATE_KEY` - ImageKit private key
- `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT` - ImageKit URL endpoint
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` - Email configuration

## Architecture & Key Patterns

### Application Structure
```
src/
├── app/                      # Next.js App Router pages & API routes
│   ├── api/                  # Backend API endpoints
│   │   ├── auth/             # Authentication (login, logout, session)
│   │   ├── products/         # Product CRUD operations
│   │   ├── admin/            # Admin operations (user management)
│   │   └── imagekit/         # ImageKit upload & auth endpoints
│   ├── admin/                # Admin panel pages & components
│   ├── products/             # Product listing & detail pages
│   ├── cart/                 # Shopping cart page
│   ├── billing/              # Checkout page
│   ├── landing-page/         # Homepage
│   └── layout.tsx            # Root layout with metadata
├── lib/                      # Core utilities
│   ├── db.ts                 # Neon database connection
│   └── imagekit.ts           # ImageKit client & helpers
├── utils/                    # Helper functions
│   └── cart.ts               # Cart management (localStorage)
├── config/                   # Configuration
│   └── site.ts               # Site settings, admin password, contact info
├── Navigation/               # Header & layout components
└── Footer/                   # Footer component
```

### Database Schema

**Products Table:**
- Primary key: `code` (format: `BCH-LP-XXXX` for laptops, `BCH-AC-XXXX` for accessories)
- Fields: name, brand, price, offer_price, stock, condition, type, category
- Specs: processor, ram, storage, screen, graphics, graphics_storage
- Media: `image` (comma-separated URLs for multiple images)
- Optional: `colors` (comma-separated color options) - may not exist on all databases
- Metadata: feature, about, badge, date_added, updated_at

**Users Table:**
- Fields: username, password_hash (SHA-256), role (e.g., 'accountant'), status
- Used for admin authentication

### Authentication System
- Session-based authentication using HTTP-only cookies
- Admin password is stored in `src/config/site.ts` (for backward compatibility)
- Database-backed user authentication via `/api/auth/login`
- Session validation via `/api/auth/session`
- Protected routes check session on mount and redirect to `/admin/login` if unauthorized

### Image Management
- Images are stored on ImageKit CDN
- Multiple images per product stored as comma-separated URLs in database
- Upload endpoint: `POST /api/imagekit/upload`
- Auth endpoint: `GET /api/imagekit/auth` (for client-side uploads)
- Helper functions in `src/lib/imagekit.ts`: `uploadToImageKit()`, `deleteFromImageKit()`

### Cart System
- Client-side cart stored in localStorage (key: `bizzcohub_cart`)
- Cart utilities in `src/utils/cart.ts`: `getCart()`, `addToCart()`, `removeFromCart()`, `updateCartItemQuantity()`, `clearCart()`
- Cart supports product variants (processor, RAM, storage, color options)
- Cart updates trigger `cart-updated` event for header badge updates

### API Routes

**Products:**
- `GET /api/products` - List products (query params: type, categoryFilter, code)
- `POST /api/products` - Create product
- `PUT /api/products` - Update product (requires code in body)
- `DELETE /api/products` - Delete product (requires code in query)
- `POST /api/products/import` - Bulk import products
- `GET /api/products/generate-code` - Generate next sequential product code

**Authentication:**
- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/logout` - Logout and clear session
- `GET /api/auth/session` - Check current session

**ImageKit:**
- `GET /api/imagekit/auth` - Get auth parameters for client-side uploads
- `POST /api/imagekit/upload` - Server-side image upload

### Error Handling Patterns
- All API routes use try-catch blocks with detailed error logging
- Database operations include fallback logic for missing columns (e.g., `colors` column)
- Client components handle auth failures by redirecting to login
- Image operations fail gracefully with error messages

## Development Workflows

### Adding a New Product Field
1. Add SQL migration to `/migrations` directory
2. Update database schema in Neon console
3. Modify API routes in `src/app/api/products/route.ts`:
   - Add field to INSERT statement
   - Add field to UPDATE statement
   - Add field to `transformProduct()` function
4. Update admin product form components
5. Update product detail page rendering

### Working with Images
- Use ImageKit for all product images
- Images are uploaded via `POST /api/imagekit/upload` as base64 strings
- Store returned URLs in database as comma-separated strings
- Frontend parses comma-separated URLs into arrays

### Testing Product APIs
```powershell
# Fetch all products
curl http://localhost:3000/api/products

# Fetch by type
curl "http://localhost:3000/api/products?type=laptop"

# Fetch by category/brand
curl "http://localhost:3000/api/products?categoryFilter=Dell"

# Fetch single product
curl "http://localhost:3000/api/products?code=BCH-LP-1000"
```

### Admin Panel Access
- URL: `http://localhost:3000/admin/login`
- Default admin password in `src/config/site.ts` (line 32)
- Database users require SHA-256 hashed passwords

## Important Conventions

### Code Generation
- Product codes are sequential: `BCH-LP-XXXX` (laptops), `BCH-AC-XXXX` (accessories)
- Codes are generated by querying the highest existing code and incrementing
- Generator endpoint: `GET /api/products/generate-code?type=laptop|accessory`

### Database Queries
- Use template literals with `sql` from `@/lib/db`
- All API routes have `export const dynamic = 'force-dynamic'` to prevent caching
- Queries use parameterized inputs to prevent SQL injection

### TypeScript Paths
- `@/*` maps to `./src/*` (configured in `tsconfig.json`)
- Use absolute imports from `src/`: `import { sql } from '@/lib/db'`

### Styling
- No CSS framework; custom CSS files per component/section
- Admin panel styles in `src/app/admin/styles/`
- Global styles in `src/app/globals.css`
- Uses Font Awesome icons (CDN loaded in layout)

### State Management
- No global state library (Redux, Zustand, etc.)
- Cart managed via localStorage + custom events
- Admin state managed via React useState/useEffect
- Server state fetched on component mount

## PowerShell Considerations
This project is primarily developed on Windows with PowerShell. When suggesting shell commands:
- Use PowerShell syntax (e.g., `Get-ChildItem` instead of `ls -la`)
- Use backslashes for paths or PowerShell-compatible forward slashes
- Use `Copy-Item` instead of `cp`, `Remove-Item` instead of `rm`

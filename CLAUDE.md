# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**WENS DOOR** is a React-based Customer Relationship Management (CRM) application for managing door and window projects. Built with TypeScript, Tailwind CSS, and Supabase for the backend.

### Key Features
- **Project Management (Spis)** - 8-tab modal for complete project tracking
- **Quote Generation** - PDF quotes for doors, furniture, stairs, frames
- **Contact Management** - Customers, architects, billing entities with forking
- **Order Tracking** - Order status and delivery monitoring
- **Task Management** - Team task assignment and tracking
- **Vacation Scheduling** - Employee vacation management
- **Document Locking** - Prevents concurrent editing conflicts
- **Dark Mode** - Full dark/light/auto theme support

### Tech Stack
- **Frontend:** React 18, TypeScript 5, Tailwind CSS 3
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Routing:** React Router v6
- **PDF Generation:** jsPDF with autoTable
- **Deployment:** Netlify
- **External APIs:** Slovak RPO API for company lookups

## Development Commands

```bash
npm start       # Development server on localhost:3000
npm run build   # Production build (used by Netlify)
npm test        # Run test suite
```

## Project Structure

```
src/
├── App.tsx                              # Root routing and context provider hierarchy
├── index.tsx                            # React DOM entry point
├── index.css                            # Global styles and animations
│
├── components/                          # Page components and UI
│   ├── AuthWrapper.tsx                  # Login/Register page UI
│   ├── Spis.tsx                         # Project file management (main feature)
│   ├── Objednavky.tsx                   # Orders and Products view with tabs
│   ├── Kontakty.tsx                     # Contact management CRUD
│   ├── Nastavenia.tsx                   # User settings/preferences
│   ├── Zamestnanci.tsx                  # Employee list (restricted access)
│   ├── Dovolenky.tsx                    # Vacation management
│   ├── Ulohy.tsx                        # Task management
│   ├── ProductDetailModal.tsx           # Product detail modal
│   │
│   ├── common/
│   │   ├── SortableTable.tsx            # Reusable table with sort/filter/search/pagination
│   │   ├── CustomDatePicker.tsx         # Date picker wrapper
│   │   ├── FileDropZone.tsx             # File upload component
│   │   └── PDFPreviewModal.tsx          # PDF preview modal
│   │
│   ├── layout/
│   │   ├── Layout.tsx                   # Main layout wrapper
│   │   ├── Sidebar.tsx                  # Navigation sidebar (red gradient)
│   │   ├── Header.tsx                   # Mobile header with menu toggle
│   │   └── StyledNavLink.tsx            # Styled navigation links
│   │
│   └── tasks/
│       ├── TaskCreateModal.tsx          # Task creation modal
│       └── TaskPopup.tsx                # Task notification popup
│
├── contexts/                            # React Context providers (8 total)
│   ├── AuthContext.tsx                  # Authentication & session management
│   ├── ThemeContext.tsx                 # Dark mode theme management
│   ├── ContactsContext.tsx              # Contact data management
│   ├── SpisContext.tsx                  # Spis entries with pagination
│   ├── TasksContext.tsx                 # Task management
│   ├── ProductsContext.tsx              # Product catalog management
│   ├── PermissionsContext.tsx           # User permission/role management
│   └── DocumentLockContext.tsx          # Document locking for concurrent editing
│
├── features/
│   └── Spis/                            # Complex Spis feature module
│       ├── components/
│       │   ├── SpisEntryModal.tsx       # Main 8-tab modal (lazy loaded tabs)
│       │   ├── VseobecneForm.tsx        # General info form with RPO autocomplete
│       │   ├── VseobecneSidebar.tsx     # Sidebar for general info quick view
│       │   ├── CenovePonukyTab.tsx      # Price quotes management
│       │   ├── ObjednavkyTab.tsx        # Orders management
│       │   ├── EmailyTab.tsx            # Email tracking
│       │   ├── MeranieTab.tsx           # Measurement tracking
│       │   ├── FotkyTab.tsx             # Photo management (Supabase Storage)
│       │   ├── VyrobneVykresyTab.tsx    # Production drawings
│       │   ├── TechnickeVykresyTab.tsx  # Technical drawings
│       │   ├── DvereForm.tsx            # Doors quote form
│       │   ├── NabytokForm.tsx          # Furniture quote form
│       │   ├── SchodyForm.tsx           # Stairs quote form
│       │   ├── PuzdraForm.tsx           # Frames quote form
│       │   ├── AddTemplateModal.tsx     # Modal to add quote templates
│       │   ├── AddOrderModal.tsx        # Modal to add orders
│       │   ├── ContactChangesModal.tsx  # Modal to handle contact changes
│       │   │
│       │   └── common/
│       │       ├── QuoteLayout.tsx      # Layout wrapper for quotes
│       │       ├── QuoteHeader.tsx      # Quote header with company/customer info
│       │       ├── QuoteFooter.tsx      # Quote footer with totals
│       │       ├── QuoteSummary.tsx     # Quote summary section
│       │       ├── GenericItemsTable.tsx# Reusable table for quote items
│       │       └── RpoAutocomplete.tsx  # Autocomplete for company lookup
│       │
│       ├── hooks/
│       │   └── useSpisEntryLogic.ts     # Complex form state management (well documented)
│       │
│       ├── types/
│       │   └── index.ts                 # TypeScript interfaces for Spis feature
│       │
│       └── utils/
│           ├── priceCalculations.ts     # Price/DPH calculation with memoization cache
│           ├── pdfGenerator.ts          # PDF generation using jsPDF
│           └── rpoApi.ts                # Slovak RPO API integration
│
├── lib/
│   └── supabase.ts                      # Supabase client setup and DB type definitions
│
└── utils/
    ├── imageCompression.ts              # Image compression utilities
    └── photoMigration.ts                # Photo storage migration helpers
```

## Architecture

### Provider Hierarchy

```typescript
<ThemeProvider>
  <AuthProvider>
    <PermissionsProvider>
      <DocumentLockProvider>
        <ContactsProvider>
          <SpisProvider>
            <TasksProvider>
              <ProductsProvider>
                <Layout>
                  <Routes />
                </Layout>
              </ProductsProvider>
            </TasksProvider>
          </SpisProvider>
        </ContactsProvider>
      </DocumentLockProvider>
    </PermissionsProvider>
  </AuthProvider>
</ThemeProvider>
```

### Context Providers

1. **AuthContext** - Supabase Auth with email/password, session persistence, auto token refresh
2. **ThemeContext** - Dark/light/auto mode with system preference detection
3. **ContactsContext** - Contact CRUD with project associations and forking
4. **SpisContext** - Project entries with pagination (50 per page), infinite scroll
5. **TasksContext** - Task management with user assignment
6. **ProductsContext** - User-scoped product catalog
7. **PermissionsContext** - Role-based permissions (super admin: richter@wens.sk)
8. **DocumentLockContext** - Concurrent editing prevention with 30s heartbeat

### Routing Structure

```
/ → /spis (redirect)
├── /spis              # Project files table
├── /objednavky        # Orders & Products (tabbed)
├── /kontakty          # Contact management
├── /zamestnanci       # Employee list (restricted)
├── /dovolenky         # Vacation management
├── /ulohy             # Task management
└── /nastavenia        # Settings
```

## Database Schema (Supabase)

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | User profiles (extends auth.users) | id, email, first_name, last_name, last_seen |
| `contacts` | Customers, architects, billing | meno, priezvisko, typ, project_ids, ico, ic_dph |
| `spis_entries` | Project files with full data | stav, cislo_cp, full_form_data (JSONB) |
| `tasks` | Task assignments | title, status, priority, assigned_to, due_date |
| `products` | Product catalog | name, kod, supplier, price |
| `dovolenky` | Vacation records | name, start_date, end_date |
| `document_locks` | Concurrent editing locks | document_id, locked_by, last_heartbeat |
| `user_preferences` | User settings | theme, phone, settings (JSONB) |
| `firma_options` | Company dropdown options | name |
| `employee_permissions` | Access control | can_view_zamestnanci |

### Row Level Security
- All tables have RLS policies
- Users can view shared data (contacts, projects, tasks)
- Users can only modify their own data where applicable
- Super admin has elevated permissions

## Key Features Explained

### Project Files (Spis) - 8 Tabs

1. **Všeobecné** - Customer, architect, executor info with RPO API autocomplete
2. **Cenové Ponuky** - Price quotes with PDF generation (4 types)
3. **Objednávky** - Order tracking with delivery status
4. **Emaily** - Email log
5. **Meranie** - Measurement records
6. **Fotky** - Photo uploads to Supabase Storage (with compression)
7. **Výrobné Výkresy** - Production drawings
8. **Technické Výkresy** - Technical drawings

### Quote Types

| Type | Form Component | Description |
|------|---------------|-------------|
| Dvere | DvereForm.tsx | Doors with hardware, assembly, discounts |
| Nábytok | NabytokForm.tsx | Custom furniture |
| Schody | SchodyForm.tsx | Staircases |
| Puzdra | PuzdraForm.tsx | Frame supplier orders |

### Price Calculation Formula

```
vyrobkyTotal = sum of all products
priplatkyTotal = sum of all supplements
subtotal = vyrobkyTotal + priplatkyTotal
zlava = subtotal × zlavaPercent / 100
afterZlava = subtotal - zlava
cenaBezDPH = afterZlava + kovanieTotal + montazTotal
dph = cenaBezDPH × 0.23 (23% VAT)
cenaSDPH = cenaBezDPH + dph
```

**Note:** Results are cached for 5 seconds via memoization.

### Document Locking

- Lock acquired when opening Spis entry for editing
- 30-second heartbeat refresh interval
- 2-minute expiry without heartbeat
- Queue system shows waiting users
- Lock released on modal close

### Contact Forking

When modifying a contact used in multiple projects:
1. System detects changes vs. original contact
2. ContactChangesModal offers options:
   - Update original contact
   - Create fork (copy) for this project only
   - Cancel changes
3. Fork tracked via `original_contact_id`

## Performance Optimizations

1. **Lazy Loading** - Tab components loaded with React.lazy() and Suspense
2. **Pagination** - 50 entries per page with infinite scroll
3. **Memoization** - 5-second TTL cache for price calculations
4. **Image Compression** - Photos compressed before upload
5. **Code Splitting** - Heavy modals loaded on demand

## Styling & Design System

- **Framework:** Tailwind CSS 3
- **Primary Color:** `#e11b28` (red)
- **Hover Color:** `#c71325` (darker red)
- **Sidebar Gradient:** `from-[#e11b28] to-[#b8141f]`
- **Font:** Inter (Google Fonts)
- **Dark Mode:** CSS class-based with `isDark` conditional

### Dark Mode Colors

```javascript
dark: {
  950: '#0a0a0a', // Darkest - main background
  900: '#0f0f0f', // Page background
  800: '#1a1a1a', // Modal/card background
  700: '#262626', // Form container
  600: '#333333', // Input background
  500: '#404040', // Borders
}
```

### Dark Mode Pattern

```typescript
className={`base-classes ${isDark ? 'dark-classes' : 'light-classes'}`}
```

## Common Patterns

### Adding New Form Fields

1. Add field to TypeScript interface in `types/index.ts`
2. Add to `SpisFormData` interface
3. Add input element in relevant form component
4. Update `useSpisEntryLogic` if needed
5. Include in PDF generation if applicable

### Adding New Quote Type

1. Create form component (e.g., `VlneniForm.tsx`)
2. Add interface to `types/index.ts`
3. Add calculation function to `priceCalculations.ts`
4. Update `pdfGenerator.ts` for PDF support
5. Add to `AddTemplateModal.tsx` type options
6. Update `CenovePonukyTab.tsx` to handle new type
7. Add to `CenovaPonukaItem` type union

### Adding New Context Provider

1. Create context file in `src/contexts/`
2. Define interface with all state and methods
3. Create Provider component with hooks
4. Export `useContextName` hook
5. Add Provider to hierarchy in `App.tsx`

## Environment Variables

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

**Note:** Never commit `.env` to git.

## Dependencies (Updated)

```json
{
  "react": "^18.2.0",
  "react-router-dom": "^6.30.2",
  "typescript": "^5.9.3",
  "tailwindcss": "^3.4.19",
  "jspdf": "^3.0.4",
  "jspdf-autotable": "^5.0.2",
  "@supabase/supabase-js": "^2.x"
}
```

## Git Workflow

Conventional commit messages:
```
type: Short description

- Specific change 1
- Specific change 2

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

Types: `feat`, `fix`, `chore`, `refactor`, `docs`, `perf`, `test`

## Deployment

### Netlify Configuration

- Build command: `npm run build`
- Publish directory: `build`
- SPA routing: All paths redirect to `/index.html`
- Security headers configured in `netlify.toml`

---

## Recommendations

### Completed ✅

- [x] Lazy loading for SpisEntryModal tabs
- [x] Pagination for spis_entries (50 per page)
- [x] Memoization for price calculations
- [x] Photo storage migration to Supabase Storage
- [x] JSDoc comments on complex functions
- [x] README with setup instructions
- [x] Updated dependencies to latest safe versions

### High Priority

1. **Security**
   - Supabase Auth handles password hashing
   - Add input sanitization for XSS protection
   - HTTPS enforced via Netlify

2. **Data Integrity**
   - Add Zod schemas for runtime validation
   - Implement data export/import feature

### Medium Priority

3. **Testing**
   - Unit tests for price calculations
   - Component tests for form validation
   - E2E tests for critical flows

4. **UX Improvements**
   - Better mobile modal experience
   - Keyboard navigation in tables
   - Error boundaries for graceful failures

### Low Priority

5. **Future Features**
   - PWA with service worker
   - Multi-language support (i18n)
   - Real-time collaboration via Supabase Realtime

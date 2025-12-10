# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WENS Door is a React-based CRM application for managing door and window projects. The application provides interfaces for project management (Spis), orders (Objednavky), contacts (Kontakty), employees (Zamestnanci), and settings (Nastavenia). All data is stored locally in browser localStorage - there is no backend server.

## Development Commands

```bash
# Start development server on localhost:3000
npm start

# Build for production (used by Netlify)
npm run build

# Run tests
npm test
```

## Project Structure

```
src/
├── App.tsx                     # Main routing and provider setup
├── index.tsx                   # React DOM entry point
├── index.css                   # Global styles with custom animations
├── components/                 # Main page components
│   ├── AuthWrapper.tsx         # Login/Register UI with sliding animation
│   ├── Spis.tsx                # Project file management (main page)
│   ├── Objednavky.tsx          # Orders table view
│   ├── Kontakty.tsx            # Contacts management
│   ├── Nastavenia.tsx          # Settings/preferences page
│   ├── Zamestnanci.tsx         # Employees (dummy data)
│   ├── Login.tsx               # Login form component
│   ├── Register.tsx            # Registration form component
│   ├── common/
│   │   └── SortableTable.tsx   # Reusable table with sort/filter/search
│   └── layout/
│       ├── Layout.tsx          # Main layout wrapper
│       ├── Sidebar.tsx         # Navigation sidebar (red gradient)
│       ├── Header.tsx          # Mobile header with menu toggle
│       └── StyledNavLink.tsx   # Styled navigation links
├── contexts/                   # React Context providers
│   ├── AuthContext.tsx         # User authentication
│   ├── ContactsContext.tsx     # Contact management (user-scoped)
│   └── ThemeContext.tsx        # Dark mode theme management
└── features/
    └── Spis/                   # Complex Spis feature module
        ├── components/
        │   ├── SpisEntryModal.tsx      # Main modal for project entries
        │   ├── VseobecneForm.tsx       # General form with auto-complete
        │   ├── VseobecneSidebar.tsx    # Sidebar for general info
        │   ├── CenovePonukyTab.tsx     # Price quotes tab
        │   ├── ObjednavkyTab.tsx       # Orders tab
        │   ├── EmailyTab.tsx           # Emails tab
        │   ├── MeranieTab.tsx          # Measurement tab
        │   ├── FotkyTab.tsx            # Photos tab
        │   ├── VyrobneVykresyTab.tsx   # Production drawings tab
        │   ├── TechnickeVykresyTab.tsx # Technical drawings tab
        │   ├── DvereForm.tsx           # Doors quote form
        │   ├── NabytokForm.tsx         # Furniture quote form
        │   ├── PuzdraForm.tsx          # Frames quote form
        │   ├── AddTemplateModal.tsx    # Modal for adding templates
        │   └── common/
        │       ├── QuoteLayout.tsx     # Layout wrapper for quotes
        │       ├── QuoteHeader.tsx     # Quote header info
        │       ├── QuoteFooter.tsx     # Quote footer with totals
        │       ├── QuoteSummary.tsx    # Summary section
        │       └── GenericItemsTable.tsx # Reusable table for items
        ├── hooks/
        │   └── useSpisEntryLogic.ts    # Complex form state management
        ├── types/
        │   └── index.ts                # TypeScript interfaces
        └── utils/
            ├── priceCalculations.ts    # Price calculation logic
            └── pdfGenerator.ts         # PDF generation using jsPDF
```

## Architecture

### Context-Based State Management

The application uses React Context for global state management with three main contexts:

1. **AuthContext** (`src/contexts/AuthContext.tsx`)
   - Manages user authentication using localStorage
   - User data stored in `users` (all users) and `currentUser` (logged-in user)
   - Provides: `user`, `login()`, `register()`, `logout()`, `changePassword()`, `isLoading`
   - Password requirements: 12+ chars, uppercase, number, special character
   - No real backend - passwords stored in plain text (demo/local use only)

2. **ThemeContext** (`src/contexts/ThemeContext.tsx`)
   - Manages dark mode with three options: 'light', 'dark', 'auto'
   - Auto mode detects system preference via `window.matchMedia`
   - Provides: `theme`, `setTheme()`, `isDark` (boolean)
   - Applies 'dark' class to `document.documentElement`

3. **ContactsContext** (`src/contexts/ContactsContext.tsx`)
   - Manages contact data with project associations
   - User-scoped storage: `contacts_${userId}`
   - Contact types: 'zakaznik' (customer), 'architekt' (architect)
   - Contact forking: Creates copy when modifying shared contacts
   - Provides: `contacts`, `addContact()`, `updateContact()`, `deleteContact()`, `getContactById()`, `getContactsByProject()`, `getContactByNameAndType()`

### Component Provider Hierarchy

```typescript
<ThemeProvider>
  <AuthProvider>
    <ContactsProvider>
      <AppContent />  // Router
    </ContactsProvider>
  </AuthProvider>
</ThemeProvider>
```

### Routing Structure

```
/ → redirects to /spis
├── /spis         # Project management (default)
├── /objednavky   # Orders list
├── /kontakty     # Contacts CRUD
├── /zamestnanci  # Employees (dummy)
└── /nastavenia   # Settings
```

### Main Components

- **Spis** (`src/components/Spis.tsx`) - Project file management with SpisEntryModal. Supports row highlighting when navigating from Objednavky.

- **SpisEntryModal** (`src/features/Spis/components/SpisEntryModal.tsx`) - 8-tab modal for project entries:
  - Všeobecné (General) - Customer/architect/executor info with auto-complete
  - Cenové Ponuky (Price Quotes) - List of quotes with edit/delete/PDF
  - Objednávky (Orders) - Order items with dates
  - Emaily (Emails) - Email tracking
  - Meranie (Measurement) - Measurement logs
  - Fotky (Photos) - Image upload with base64 storage
  - Výrobné Výkresy (Production Drawings)
  - Technické Výkresy (Technical Drawings)

- **Objednavky** (`src/components/Objednavky.tsx`) - Orders derived from all Spis entries. Click navigates to parent Spis entry.

- **Kontakty** (`src/components/Kontakty.tsx`) - Contact management with form validation (email, phone, IČO format).

- **Nastavenia** (`src/components/Nastavenia.tsx`) - User profile, theme selector, password change.

- **Zamestnanci** (`src/components/Zamestnanci.tsx`) - Static employee data (no persistence).

### Quote System

Three quote types with different forms:
- **Dvere (Doors)** - Products, discounts, hardware, assembly with ks × price calculations
- **Nabytok (Furniture)** - Similar structure to doors
- **Puzdra (Frames)** - Supplier info, order items, delivery address

Each quote type has:
- Dedicated form component (DvereForm, NabytokForm, PuzdraForm)
- Price calculation function in `priceCalculations.ts`
- PDF generation via `pdfGenerator.ts`

### Data Persistence

**User-Scoped Keys** (multi-user support):
- `contacts_${userId}` - User contacts
- `spisEntries_${userId}` - Project entries
- `firmaOptions_${userId}` - Company dropdown options
- `preferences_${userId}` - User preferences

**Global Keys**:
- `users` - All user accounts
- `currentUser` - Logged-in user
- `theme` - Theme setting
- `selectedOrder` - Temporary order selection for navigation

### Key Patterns

#### Contact Forking (Copy-on-Write)
When modifying a contact used in multiple projects, a new contact is created to prevent unintended updates. Original tracked via `originalContactId`.

#### Auto-Complete with Contact Lookup
VseobecneForm provides auto-complete for customer/architect fields by searching contacts by name and type.

#### Form Change Detection
`useSpisEntryLogic` compares `lastSavedJson` to detect unsaved changes and only saves when data differs.

#### CP Number Auto-Generation
Quote numbers generated as `CP2025/####` format with sequential numbering.

## Styling & Design System

- **UI Framework**: Tailwind CSS
- **Primary Brand Color**: `#e11b28` (red)
- **Hover Color**: `#c71325` (darker red)
- **Sidebar Gradient**: `from-[#e11b28] to-[#b8141f]`
- **Font**: Inter (Google Fonts)
- **Viewport Height**: `100dvh` (accounts for mobile address bar)

Dark mode pattern:
```typescript
className={`base-classes ${isDark ? 'dark-classes' : 'light-classes'}`}
```

Custom animations in `index.css`: `slideIn`, `expandWidth`, `fadeIn`, `slideOut`

## Common Patterns

### Adding New Form Fields

1. Add field to component state or TypeScript interface
2. Add to localStorage save/load logic (respect user-scoped keys)
3. Add form input with dark mode styling
4. Update validation if needed
5. If related to contacts, update ContactsContext interface

### Adding New Quote Type

1. Create form component in `src/features/Spis/components/`
2. Add calculation function in `priceCalculations.ts`
3. Update `pdfGenerator.ts` for PDF support
4. Add type to CenovaPonukaItem type union
5. Register in AddTemplateModal and CenovePonukyTab

### Color Scheme Updates

Search for these Tailwind classes:
- `bg-[#e11b28]`, `hover:bg-[#c71325]` - Primary buttons
- `border-[#e11b28]`, `text-[#e11b28]` - Active states
- `focus:ring-[#e11b28]` - Focus rings
- `from-[#e11b28] to-[#b8141f]` - Sidebar gradient

## Dependencies

```json
{
  "react": "^18.2.0",
  "react-router-dom": "^6.8.0",
  "jspdf": "^3.0.4",
  "jspdf-autotable": "^5.0.2",
  "tailwindcss": "^3.2.7",
  "typescript": "^4.9.0"
}
```

## Git Workflow

Conventional commit messages with:
- Descriptive title summarizing the change
- Bullet points of specific changes made
- Footer with Claude Code attribution

---

# Recommendations

## High Priority

### 1. Security Improvements
- **Hash passwords**: Currently stored in plain text. Use bcrypt or similar before any production use.
- **Sanitize inputs**: Add XSS protection for user-generated content displayed in UI.
- **Add HTTPS enforcement**: Ensure deployed version uses HTTPS only.

### 2. Data Integrity
- **Add data validation schemas**: Use Zod or Yup for runtime validation of localStorage data.
- **Implement data migration**: Version localStorage schema and add migrations for breaking changes.
- **Add data export/import**: Allow users to backup their data as JSON files.

### 3. Performance
- **Optimize photo storage**: Base64 in localStorage is inefficient. Consider IndexedDB for large files.
- **Lazy load heavy components**: SpisEntryModal is large; consider code splitting.
- **Memoize expensive calculations**: Price calculations run on every render.

## Medium Priority

### 4. Code Organization
- **Extract remaining components**: Move Objednavky, Kontakty logic into feature folders like Spis.
- **Create shared hooks**: Extract common localStorage patterns into reusable hooks.
- **Centralize constants**: Move magic strings (localStorage keys, routes) to constants file.

### 5. Testing
- **Add unit tests**: Price calculation functions are ideal candidates.
- **Add component tests**: Test form validation and context interactions.
- **Add E2E tests**: Critical flows (login, create quote, generate PDF).

### 6. User Experience
- **Add loading states**: Show spinners during async operations.
- **Add error boundaries**: Catch React errors gracefully.
- **Improve mobile UX**: Some modals are cramped on small screens.
- **Add keyboard navigation**: Tab support in forms and tables.

## Low Priority

### 7. Documentation
- **Add JSDoc comments**: Complex functions like `useSpisEntryLogic` need documentation.
- **Create component storybook**: Visual documentation for UI components.

### 8. Future Features
- **Offline-first with service worker**: Enable PWA capabilities.
- **Multi-language support**: Extract Slovak text to i18n files.
- **Print stylesheets**: Better printing support for quotes.
- **Cloud sync option**: Optional backend for data sync across devices.

### 9. Code Quality
- **Enable strict TypeScript**: Fix any type usages.
- **Add ESLint rules**: Enforce consistent code style.
- **Remove dead code**: Clean up deleted components (CennikMaterialov.tsx, Technicke.tsx marked as deleted in git).

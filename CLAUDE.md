# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WENS Door is a React-based CRM application for managing door and window projects. The application provides interfaces for project management (Spis), orders (Objednavky), contacts (Kontakty), and settings (Nastavenia). All data is stored locally in browser localStorage - there is no backend server.

## Development Commands

```bash
# Start development server on localhost:3000
npm start

# Build for production (used by Netlify)
npm run build

# Run tests
npm test
```

## Architecture

### Context-Based State Management

The application uses React Context for global state management with three main contexts:

1. **AuthContext** (`src/contexts/AuthContext.tsx`)
   - Manages user authentication using localStorage
   - User data stored in `localStorage.getItem('users')` and `localStorage.getItem('currentUser')`
   - Provides: `user`, `login()`, `register()`, `logout()`, `changePassword()`, `isLoading`
   - No real backend - passwords stored in plain text in localStorage (demo/local use only)

2. **ThemeContext** (`src/contexts/ThemeContext.tsx`)
   - Manages dark mode with three options: 'light', 'dark', 'auto'
   - Auto mode detects system preference via `window.matchMedia('(prefers-color-scheme: dark)')`
   - Provides: `theme`, `setTheme()`, `isDark` (boolean)
   - Theme preference persisted to localStorage
   - All components conditionally style using the `isDark` boolean

3. **ContactsContext** (`src/contexts/ContactsContext.tsx`)
   - Manages contact data with project associations
   - Contacts can be linked to multiple projects via `projectIds` array
   - Provides: `contacts`, `addContact()`, `updateContact()`, `getContactById()`, `getContactsByProject()`, `associateContactWithProject()`
   - Contact data persisted to localStorage

### Component Provider Hierarchy

```typescript
<ThemeProvider>
  <AuthProvider>
    <ContactsProvider>
      <AppContent />
    </ContactsProvider>
  </AuthProvider>
</ThemeProvider>
```

This hierarchy is important - contexts must be accessed only within their respective providers.

### Main Components

- **Spis** (`src/components/Spis.tsx`) - Project file management with tabbed interface (Všeobecné, Objednávky, Technické, Cenník materiálov). Contains complex form with multiple sections including door specifications, customer/architect info, and order details.

- **Objednavky** (`src/components/Objednavky.tsx`) - Orders table view with search and filter capabilities.

- **Kontakty** (`src/components/Kontakty.tsx`) - Contact management with table view and add/edit popup forms.

- **Nastavenia** (`src/components/Nastavenia.tsx`) - Settings page with tabs for user profile, preferences (theme selector), and password change.

### Data Persistence

All application data is stored in localStorage with these keys:
- `users` - User accounts array
- `currentUser` - Currently logged-in user object
- `contacts` - Contacts array
- `spisEntries` - Project entries array (from Spis component)
- `objednavkyData` - Orders data array
- `firmaOptions` - Company options for dropdowns
- `theme` - Current theme setting ('light', 'dark', or 'auto')

**Important**: When adding new form fields or data structures, ensure they are properly saved to and loaded from localStorage in the component's state initialization and useEffect hooks.

### Styling & Design System

- **UI Framework**: Tailwind CSS with custom configuration
- **Primary Brand Color**: `#e11b28` (red) - used for buttons, active states, focus rings
- **Hover Color**: `#c71325` (darker red)
- **Dark Mode**: All components support dark mode using conditional Tailwind classes based on `isDark` from ThemeContext
- **Font**: Inter (loaded from Google Fonts)

Dark mode styling pattern:
```typescript
className={`base-classes ${isDark ? 'dark-classes' : 'light-classes'}`}
```

### Form Data Persistence Pattern

Forms use localStorage to persist data between page refreshes. Pattern used across Spis, Kontakty, and other forms:

```typescript
const [formData, setFormData] = useState(() => {
  const saved = localStorage.getItem('formKey');
  return saved ? JSON.parse(saved) : defaultFormState;
});

useEffect(() => {
  localStorage.setItem('formKey', JSON.stringify(formData));
}, [formData]);
```

When modifying forms, maintain this pattern to ensure data isn't lost.

### Table Features

Tables in Objednavky, Kontakty, and Spis components implement:
- Column-based search with animated search icon toggle
- Sort by clicking column headers
- Filter functionality
- Responsive design for mobile/desktop

Search animation pattern (added to `src/index.css`):
- Uses custom `@keyframes` for `slideIn`, `expandWidth`, `fadeIn` animations
- Applied via inline `style={{ animation: '...' }}` props on search containers

## Common Patterns

### Adding New Form Fields

1. Add field to component state's form object
2. Ensure field is included in localStorage save/load logic
3. Add form input with proper dark mode styling
4. Update validation if needed
5. If field relates to contacts, consider updating ContactsContext interface

### Color Scheme Updates

When changing UI colors, search for these Tailwind classes:
- `bg-[#e11b28]` and `hover:bg-[#c71325]` - Primary buttons
- `bg-blue-*` - Old blue colors that should be red
- `border-[#e11b28]`, `text-[#e11b28]` - Active states
- `focus:ring-[#e11b28]` - Focus states

### Adding Animations

Custom animations are defined in `src/index.css` using `@keyframes`. Apply them using inline styles:
```typescript
style={{ animation: 'animationName duration ease-out' }}
```

## Git Workflow

The repository uses conventional commit messages. When committing changes via Claude Code, commits include:
- Descriptive title summarizing the change
- Bullet points of specific changes made
- Footer with Claude Code attribution

Example commit format is shown in recent history (see `git log`).

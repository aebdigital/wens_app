# WENS DOOR CRM

A React-based Customer Relationship Management (CRM) application for managing door and window projects. Built with TypeScript, Tailwind CSS, and Supabase.

## Features

- **Project Management (Spis)** - Create and manage project files with quotes, orders, photos, and documents
- **Quote Generation** - Generate PDF quotes for doors, furniture, stairs, and frames
- **Contact Management** - Track customers, architects, and billing entities
- **Order Tracking** - Monitor order status and delivery dates
- **Task Management** - Assign and track tasks across team members
- **Vacation Scheduling** - Manage employee vacations
- **Dark Mode** - Full dark mode support with system preference detection
- **Concurrent Editing** - Document locking prevents editing conflicts

## Tech Stack

- **Frontend:** React 18, TypeScript 5, Tailwind CSS 3
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Routing:** React Router v6
- **PDF Generation:** jsPDF with autoTable
- **Deployment:** Netlify

## Prerequisites

- Node.js 18+ (recommended: 20+)
- npm 9+
- Supabase account and project

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/aebdigital/wens_app.git
   cd wens_app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory:
   ```env
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Set up Supabase database**

   Run the migrations in the `supabase/migrations` folder or create the following tables:
   - `users` (extends auth.users)
   - `contacts`
   - `spis_entries`
   - `tasks`
   - `products`
   - `dovolenky` (vacations)
   - `firma_options`
   - `user_preferences`
   - `employee_permissions`
   - `document_locks`

5. **Start the development server**
   ```bash
   npm start
   ```

   The app will be available at [http://localhost:3000](http://localhost:3000)

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start development server on port 3000 |
| `npm run build` | Create optimized production build |
| `npm test` | Run test suite |

## Project Structure

```
src/
├── components/           # Page components and UI
│   ├── common/          # Reusable components (tables, dropzones)
│   ├── layout/          # Layout components (sidebar, header)
│   └── tasks/           # Task-related components
├── contexts/            # React Context providers
│   ├── AuthContext      # Authentication & sessions
│   ├── ThemeContext     # Dark mode management
│   ├── ContactsContext  # Contact CRUD operations
│   ├── SpisContext      # Project file management
│   ├── TasksContext     # Task management
│   └── ...
├── features/
│   └── Spis/            # Main feature module
│       ├── components/  # Modal, forms, tabs
│       ├── hooks/       # useSpisEntryLogic
│       ├── types/       # TypeScript interfaces
│       └── utils/       # Price calculations, PDF generation
├── lib/
│   └── supabase.ts      # Supabase client configuration
└── utils/               # Shared utilities
```

## Key Features Explained

### Project Files (Spis)

The core feature with 8 tabs:
1. **Všeobecné** - Customer, architect, executor info with RPO API autocomplete
2. **Cenové Ponuky** - Price quotes with PDF generation
3. **Objednávky** - Order tracking
4. **Emaily** - Email log
5. **Meranie** - Measurement records
6. **Fotky** - Photo uploads with compression
7. **Výrobné Výkresy** - Production drawings
8. **Technické Výkresy** - Technical drawings

### Quote Types

- **Dvere (Doors)** - Door products, hardware, assembly
- **Nábytok (Furniture)** - Custom furniture quotes
- **Schody (Stairs)** - Staircase quotes
- **Puzdra (Frames)** - Frame supplier orders

### Document Locking

Prevents concurrent editing conflicts:
- Lock acquired when opening a project
- 30-second heartbeat refresh
- 2-minute expiry without heartbeat
- Queue system for waiting users

## Environment Variables

| Variable | Description |
|----------|-------------|
| `REACT_APP_SUPABASE_URL` | Your Supabase project URL |
| `REACT_APP_SUPABASE_ANON_KEY` | Supabase anonymous/public key |

## Deployment

### Netlify (Recommended)

1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Add environment variables in Netlify dashboard

The `netlify.toml` file is pre-configured with:
- SPA routing redirects
- Security headers
- Asset caching

### Manual Deployment

```bash
npm run build
# Deploy the /build folder to your hosting provider
```

## Database Schema

### Core Tables

- **users** - User profiles (extends Supabase Auth)
- **contacts** - Customers, architects, billing entities
- **spis_entries** - Project files with full form data (JSONB)
- **tasks** - Task assignments and tracking
- **products** - Product catalog
- **dovolenky** - Vacation records
- **document_locks** - Concurrent editing locks

### Row Level Security

All tables have RLS policies:
- Users can view shared data (contacts, projects)
- Users can only modify their own data where applicable
- Super admin (`richter@wens.sk`) has elevated permissions

## Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Run tests: `npm test`
4. Build to verify: `npm run build`
5. Commit with descriptive message
6. Push and create a Pull Request

## License

Private - All rights reserved

## Support

For issues and feature requests, please use the GitHub Issues page.

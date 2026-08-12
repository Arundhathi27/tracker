# BudgetWise 💰

> Take control of your money.

A production-ready personal finance application built with React Native, Expo, and Supabase.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo SDK 57 |
| Language | TypeScript |
| Navigation | Expo Router (file-based) |
| Styling | NativeWind (Tailwind CSS for RN) |
| State Management | Zustand |
| Forms | React Hook Form + Zod |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| Data Fetching | TanStack Query (React Query) |
| Animations | React Native Reanimated |
| Gestures | React Native Gesture Handler |
| Secure Storage | Expo Secure Store |
| Icons | Lucide React Native |

---

## 📋 Prerequisites

- Node.js 18+ 
- npm 9+
- Expo Go app on your device (for testing without a simulator)
- A [Supabase](https://supabase.com) account

---

## ⚙️ Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Supabase credentials in `.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

   > **Where to find these values:**
   > - Go to your [Supabase Dashboard](https://app.supabase.com)
   > - Select your project → Settings → API
   > - Copy the `Project URL` and `anon public` key

---

## 🗄️ Database Setup

Run the migration SQL in your Supabase SQL Editor:

1. Go to Supabase Dashboard → SQL Editor
2. Open `supabase/migrations/001_initial_schema.sql`
3. Copy and run the SQL

Or use the Supabase CLI:
```bash
npx supabase db push
```

---

## 📦 Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd budgetwise

# Install dependencies
npm install --legacy-peer-deps
```

---

## ▶️ Running the App

```bash
# Start the Expo dev server
npm start

# Run on Android emulator/device
npm run android

# Run on iOS simulator/device (macOS only)
npm run ios

# Run in web browser
npm run web
```

Then scan the QR code with **Expo Go** on your device, or press `a` / `i` to open in simulator.

---

## 📁 Project Structure

```
budgetwise/
├── app/                    # Expo Router file-based pages
│   ├── _layout.tsx         # Root layout (providers + navigation shell)
│   └── index.tsx           # Welcome screen
│
├── components/             # Reusable UI components
│   └── ui/                 # Design system components
│       ├── Button.tsx      # Animated button with variants
│       ├── Card.tsx        # Surface card with elevation
│       ├── EmptyState.tsx  # Empty state with animation
│       ├── Input.tsx       # Animated form input
│       ├── LoadingSpinner.tsx # Animated spinner
│       └── ScreenContainer.tsx # Safe area + scroll wrapper
│
├── constants/              # App-wide constants
│   ├── colors.ts           # Complete color palette
│   ├── theme.ts            # Design tokens (spacing, typography, etc.)
│   └── index.ts            # App constants (keys, formats, etc.)
│
├── features/               # Feature-specific code (future screens)
│   ├── auth/               # Login, Register, ForgotPassword
│   ├── dashboard/          # Overview, balance summary, recent transactions
│   ├── budget/             # Budget CRUD, progress tracking
│   ├── expenses/           # Expense list, add/edit expense
│   ├── reports/            # Monthly reports, category breakdown
│   ├── profile/            # User profile, settings
│   └── notifications/      # Push notifications, alert settings
│
├── hooks/                  # Custom React hooks
│   └── useAsync.ts         # Async state management hook
│
├── lib/                    # Third-party client configurations
│   ├── supabase.ts         # Supabase client (with secure storage)
│   └── queryClient.ts      # TanStack Query client
│
├── services/               # API service layer
│   └── base.ts             # Base service class
│
├── store/                  # Zustand state stores
│   └── index.ts            # Auth + App stores
│
├── supabase/               # Database migrations and types
│   └── migrations/
│       └── 001_initial_schema.sql
│
├── types/                  # TypeScript type definitions
│   ├── index.ts            # Domain + UI types
│   └── supabase.ts         # Database type definitions
│
├── utils/                  # Helper functions
│   ├── currency.ts         # Currency formatting
│   └── date.ts             # Date formatting
│
├── assets/                 # Images, icons, fonts
│
├── .env.example            # Environment variable template
├── app.json                # Expo configuration
├── babel.config.js         # Babel (NativeWind + Reanimated)
├── metro.config.js         # Metro bundler (NativeWind)
├── tailwind.config.js      # Tailwind CSS + NativeWind config
├── tsconfig.json           # TypeScript (with path aliases)
└── global.css              # Tailwind directives for NativeWind
```

---

## 🛤️ Path Aliases

The project uses TypeScript path aliases for clean imports:

| Alias | Path |
|---|---|
| `@/*` | Root |
| `@/components/*` | `./components/*` |
| `@/features/*` | `./features/*` |
| `@/lib/*` | `./lib/*` |
| `@/hooks/*` | `./hooks/*` |
| `@/store/*` | `./store/*` |
| `@/constants/*` | `./constants/*` |
| `@/utils/*` | `./utils/*` |
| `@/types/*` | `./types/*` |
| `@/assets/*` | `./assets/*` |

---

## 🎨 Design System

The app uses a dark-first design system with the following color tokens:

| Token | Default Color | Usage |
|---|---|---|
| `primary` | `#6366F1` (Indigo) | Main actions, links |
| `secondary` | `#06B6D4` (Cyan) | Highlights, accents |
| `success` | `#10B981` (Emerald) | Income, positive trends |
| `warning` | `#F59E0B` (Amber) | Alerts, near-limit warnings |
| `danger` | `#F43F5E` (Rose) | Expenses, errors, over-budget |
| `background` | `#0F172A` | Screen backgrounds |
| `surface` | `#1E293B` | Card backgrounds |
| `text.primary` | `#F8FAFC` | Main text |
| `text.secondary` | `#94A3B8` | Labels, hints |

---

## 🔮 Roadmap

- [ ] Authentication (login, register, forgot password)
- [ ] Dashboard with balance overview
- [ ] Budget creation and tracking
- [ ] Expense logging with categories
- [ ] Monthly reports and charts
- [ ] User profile and settings
- [ ] Push notifications
- [ ] Biometric authentication
- [ ] Multi-currency support
- [ ] Export to CSV/PDF

---

## 📝 License

MIT © BudgetWise

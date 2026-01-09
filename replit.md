# BakerIQ

## Overview

BakerIQ is a lead capture and quote management tool for custom cake bakers. The application enables bakers to:
- Provide public pricing calculators for customers to get cake and treats estimates
- Capture leads when customers submit calculator inquiries
- Manage customer relationships and convert leads to quotes
- Create and track detailed quotes with line items
- Configure custom pricing for cakes, decorations, addons, and treats

The MVP focuses on simplicity: no payment processing, no AI features, no marketplace - just lead capture and quoting that works.

### Calculator Categories
The public calculator (/c/:slug) supports two categories:
- **Cakes**: Multi-tier cake builder with size, shape, flavor, frosting, decorations, and addons
- **Treats**: Standalone treat items like cupcakes, cake pops, cookies, brownies, dipped strawberries, etc.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state, local React state for UI
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript compiled with tsx
- **API Pattern**: RESTful JSON API under `/api/*` routes
- **Session Management**: Express sessions with PostgreSQL session store (connect-pg-simple)
- **Authentication**: Cookie-based sessions with bcrypt password hashing

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` contains all table definitions and Zod validators
- **Migrations**: Drizzle Kit for schema management (`db:push` for development)

### Key Data Models
- **Bakers**: Business accounts with unique slugs for public calculator URLs
- **Customers**: Contacts belonging to a baker
- **Leads**: Incoming inquiries from the public calculator with status tracking
- **Quotes**: Formal price quotes with line items, linked to customers

### Design Patterns
- **Shared Types**: Schema definitions in `shared/` are used by both client and server
- **Storage Interface**: `server/storage.ts` abstracts database operations
- **Path Aliases**: `@/` for client code, `@shared/` for shared code
- **Component Structure**: UI primitives in `components/ui/`, feature components at component root

## External Dependencies

### Database
- PostgreSQL (required, connection via `DATABASE_URL` environment variable)
- Drizzle ORM for type-safe database queries
- Session storage in PostgreSQL via connect-pg-simple

### UI Libraries
- Radix UI primitives for accessible component foundations
- Lucide React for icons
- class-variance-authority and clsx for conditional styling
- date-fns for date formatting

### Build Tools
- Vite for frontend development and bundling
- esbuild for server bundling in production
- TypeScript for type checking

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption (optional in dev, defaults to dev key)
# Financial Budgeting Application - Design Guidelines

## Design Approach

**Reference-Based**: Drawing inspiration from ActualBudget.com, YNAB, and Mint for established financial management patterns. This utility-focused application prioritizes data clarity, precision, and trustworthy presentation over visual flourishes.

## Typography System

**Font Selection**: 
- Primary: Inter or SF Pro Display (via Google Fonts CDN) for interface text and numbers
- Monospace: JetBrains Mono for financial figures and transaction amounts

**Hierarchy**:
- Page Headers: text-3xl font-semibold
- Section Headers: text-xl font-semibold  
- Card Titles: text-lg font-medium
- Body Text: text-base font-normal
- Financial Figures: text-lg font-mono font-semibold (tracking-tight)
- Helper Text: text-sm text-gray-600
- Table Headers: text-xs font-semibold uppercase tracking-wide

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, and 16 for consistent spacing (p-4, gap-6, mt-8, etc.)

**Application Structure**:
- Fixed sidebar navigation (w-64) on desktop, collapsible on mobile
- Main content area with max-w-7xl container, px-6 py-8 padding
- Sticky header bar for account/budget switcher and user profile
- Two-panel layouts for budget management (categories left, transactions right)

## Component Library

### Navigation
- **Sidebar**: Full-height fixed navigation with logo, main menu items, budget selector, and settings at bottom
- **Top Bar**: Compact header with breadcrumbs, account switcher dropdown, quick actions, and user avatar menu
- **Tab Navigation**: For switching between budget views (All Accounts, Category Details, Reports)

### Data Display
- **Transaction Table**: Striped rows, sticky header, sortable columns (Date, Payee, Category, Amount), inline editing capability, compact row height (h-12)
- **Budget Grid**: Two-column layout per category (Budgeted | Spent), progress bars showing utilization, monthly rollover indicators
- **Account Cards**: Compact summary cards showing account name, current balance, recent activity indicator
- **Envelope Categories**: Collapsible category groups with subcategory rows, drag-and-drop reordering affordance

### Forms & Inputs
- **Transaction Entry**: Floating modal form with fields for date, payee, category, amount, account, notes
- **Budget Allocation**: Inline input fields with quick increment/decrement buttons (+/- $100, +/- $500)
- **Account Creation**: Multi-step wizard with institution selection, account type, starting balance
- **CSV Import**: File upload zone with format preview table and column mapping interface

### Data Visualization
- **Budget Progress Bars**: Horizontal bars within category rows, filled portion indicates spent percentage
- **Spending Charts**: Month-over-month bar charts, category breakdown pie charts in reports section
- **Net Worth Trend**: Line graph showing account balances over time
- **Budget vs Actual**: Side-by-side comparison bars for planned vs actual spending

### Administrative Interface
- **Client Dashboard**: Grid of user cards showing budget health scores, recent activity, shared access status
- **Budget Comparison View**: Side-by-side budget displays for planner review sessions
- **Permission Management**: Toggle switches for sharing individual budgets with planners

### Interactive Elements
- **Split Transaction Button**: Opens expandable sub-rows for transaction splitting
- **Transfer Indicator**: Visual connector between linked transfer transactions
- **Reconciliation Mode**: Toggleable view highlighting unreconciled transactions with checkboxes
- **Undo/Redo Toolbar**: Floating action bar with undo, redo, rollback to date controls

## Interaction Patterns

**Desktop-First Interactions**:
- Keyboard shortcuts for common actions (N for new transaction, E for edit, / for search)
- Right-click context menus on transactions and categories
- Drag-and-drop for categorizing transactions and reordering envelopes
- Inline editing with click-to-edit fields (double-click to activate)

**Mobile Adaptations**:
- Bottom navigation bar replacing sidebar on mobile
- Swipe actions for transaction editing/deletion
- Simplified single-column layouts
- Larger touch targets (min h-12) for all interactive elements

## Page Layouts

### Dashboard (Default Landing)
Three-column grid: Budget Summary (categories with progress) | Recent Transactions | Quick Actions sidebar

### Budget Management
Left panel: Category groups with allocation inputs | Right panel: Transactions filtered by selected category

### Accounts View
Grid of account cards with balance trends | Transaction list below with account filter tabs

### Reports
Filter toolbar | Chart display area | Detailed breakdown table

### Admin/Planner Interface
User list sidebar | Selected user's budget detail in main area | Activity timeline in right panel

## Critical Design Principles

1. **Information Density**: Maximize data visibility without clutter - use compact spacing and efficient layouts
2. **Financial Precision**: All monetary values right-aligned, clearly formatted with currency symbols, negative values distinctly styled
3. **Visual Hierarchy for Numbers**: Make balances and totals immediately scannable using size, weight, and strategic positioning
4. **Trust Signals**: Clean borders, subtle shadows, professional typography to convey reliability
5. **Minimal Animation**: Only use transitions for state changes (expanding categories, loading states), never decorative motion

## Icons
Use **Heroicons** (outline style) via CDN for all interface icons - budgets, accounts, transactions, settings, reports, search, filters
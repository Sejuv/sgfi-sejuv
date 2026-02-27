# Planning Guide

A comprehensive institutional financial management system that empowers government departments and institutions to track expenses, manage creditors, forecast spending, and gain actionable insights through an intelligent BI dashboard.

**Experience Qualities**:
1. **Professional** - Clean, trustworthy interface that conveys reliability and institutional credibility through refined visual design
2. **Efficient** - Streamlined workflows that minimize clicks and cognitive load, enabling finance teams to process transactions rapidly
3. **Insightful** - Data-rich visualizations that surface patterns and trends, transforming raw numbers into strategic intelligence

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)
This system requires multiple interconnected modules (authentication, CRUD operations, analytics, forecasting) with role-based access control, persistent data management, and sophisticated data visualization capabilities.

## Essential Features

### User Authentication & Authorization
- **Functionality**: Secure login system with role-based access control (Admin, Finance Manager, Viewer)
- **Purpose**: Protect sensitive financial data and ensure audit trails
- **Trigger**: User navigates to application URL
- **Progression**: Login screen → Credential entry → Role verification → Dashboard redirect
- **Success criteria**: Users can only access features appropriate to their role; failed login attempts are handled gracefully

### Creditor Management
- **Functionality**: CRUD operations for suppliers/vendors with detailed contact information
- **Purpose**: Centralize vendor data for consistent expense tracking and reporting
- **Trigger**: User clicks "Creditors" in sidebar navigation
- **Progression**: Creditor list view → Add/Edit dialog → Form completion → Validation → Save confirmation
- **Success criteria**: All creditors are searchable, editable, and properly linked to their expenses

### Account Categorization
- **Functionality**: Define and manage expense categories (Fixed vs. Variable costs)
- **Purpose**: Enable accurate budget allocation and cost analysis
- **Trigger**: User accesses "Categories" section
- **Progression**: Category list → Create category → Assign type (Fixed/Variable) → Save
- **Success criteria**: Categories can be assigned to expenses and properly aggregated in reports

### Expense Entry System
- **Functionality**: Comprehensive form for recording expenses with validation
- **Purpose**: Capture all relevant transaction details for accurate financial tracking
- **Trigger**: User clicks "New Expense" button
- **Progression**: Form display → Field completion (Description, Amount, Creditor, Due Date, Status, Type) → Validation → Submission → Confirmation toast
- **Success criteria**: All expenses are saved with complete data; form prevents invalid submissions

### BI Dashboard
- **Functionality**: Real-time financial overview with multiple visualization types
- **Purpose**: Provide at-a-glance insights into financial health and spending patterns
- **Trigger**: User logs in or clicks "Dashboard" in navigation
- **Progression**: Dashboard loads → Cards display summary metrics → Charts render with animations → Alerts appear for upcoming due dates
- **Success criteria**: All metrics update in real-time; visualizations accurately reflect underlying data

### Expense Forecasting
- **Functionality**: Predictive analytics based on 3-month rolling average
- **Purpose**: Enable proactive budget planning and prevent overspending
- **Trigger**: Dashboard loads or user views forecast section
- **Progression**: System calculates averages → Projects next 3 months → Displays comparison chart
- **Success criteria**: Projections are mathematically accurate and visually comparable to actual spending

### Interactive Reports
- **Functionality**: Filterable, sortable tables of all expenses with export capability
- **Purpose**: Enable detailed analysis and audit trail documentation
- **Trigger**: User navigates to "Reports" section
- **Progression**: Report table loads → User applies filters (date range, category, status) → Results update → Optional export
- **Success criteria**: Filters work correctly; data is accurate and complete

### Data Export Functionality
- **Functionality**: Export financial data to Excel and PDF formats with filtering options; PDF reports include entity logo and brasão (coat of arms) in header
- **Purpose**: Enable offline analysis, reporting to stakeholders, and compliance documentation with institutional branding
- **Trigger**: User clicks "Export" button in header or sidebar
- **Progression**: Export dialog opens → User selects date range filter (optional) → User selects format (Excel/PDF) → File downloads to browser with entity branding
- **Success criteria**: Excel files contain properly formatted data with multiple sheets (expenses + summary); PDF files include formatted tables with metrics, proper pagination, and institutional logo/brasão displayed in header when available

### Entity Management with Visual Identity
- **Functionality**: Single entity configuration with logo and brasão upload capability (PNG/JPEG up to 5MB)
- **Purpose**: Define institutional identity that appears throughout the system and in exported reports
- **Trigger**: User accesses Settings → Entities tab
- **Progression**: Settings dialog → Entities tab → Add/Edit entity form → Upload logo/brasão via file input → Preview images → Save entity
- **Success criteria**: Entity images are stored as base64, previewed correctly in settings, and rendered in PDF exports; only one entity can be registered at a time

## Edge Case Handling

- **Empty States**: Display helpful illustrations and CTA buttons when no data exists (no expenses, no creditors, etc.)
- **Overdue Payments**: Highlight overdue expenses in red with urgent indicators in the dashboard
- **Duplicate Entries**: Warn users if similar expense (same creditor, amount, date) already exists
- **Invalid Dates**: Prevent future dates for paid expenses; warn if due date is in the past
- **Network Errors**: Show retry mechanisms with friendly error messages if data operations fail
- **Permission Denied**: Display informative message when users attempt unauthorized actions
- **Large Datasets**: Implement pagination and virtualization for tables with 100+ records
- **Missing Creditors**: Provide quick-add creditor option within expense form

## Design Direction

The design should evoke **institutional trust**, **financial precision**, and **modern efficiency**. Users should feel that this is a sophisticated, government-grade tool that brings clarity to complex financial data. The aesthetic should balance authority with approachability—professional without being sterile, data-dense without feeling overwhelming.

## Color Selection

A sophisticated palette that conveys institutional credibility while maintaining visual clarity for data-heavy interfaces.

- **Primary Color (Navy Blue)**: `oklch(0.35 0.08 250)` - Conveys trust, stability, and institutional authority; used for primary actions, navigation highlights, and key data points
- **Secondary Color (Steel Gray)**: `oklch(0.55 0.01 240)` - Professional supporting color for secondary UI elements, borders, and inactive states
- **Accent Color (Teal)**: `oklch(0.65 0.15 190)` - Fresh, modern highlight for positive actions, success states, and data visualization accents
- **Warning (Amber)**: `oklch(0.75 0.15 70)` - Alerts for upcoming due dates and budget warnings
- **Destructive (Crimson)**: `oklch(0.55 0.22 15)` - Overdue payments and critical alerts

**Foreground/Background Pairings**:
- Background (White) `oklch(0.99 0 0)`: Navy text `oklch(0.35 0.08 250)` - Ratio 7.8:1 ✓
- Primary (Navy) `oklch(0.35 0.08 250)`: White text `oklch(0.99 0 0)` - Ratio 7.8:1 ✓
- Accent (Teal) `oklch(0.65 0.15 190)`: White text `oklch(0.99 0 0)` - Ratio 4.6:1 ✓
- Muted Background `oklch(0.96 0.005 240)`: Steel text `oklch(0.55 0.01 240)` - Ratio 5.2:1 ✓

## Font Selection

Typography should project **institutional professionalism** with **contemporary clarity**—sharp enough for data tables, elegant enough for executive dashboards.

- **Primary Font**: Space Grotesk (Display, headings, navigation) - Technical sophistication with distinctive geometric character
- **Secondary Font**: Inter (Body text, forms, tables) - Exceptional legibility for dense data and long reading sessions

**Typographic Hierarchy**:
- H1 (Dashboard Title): Space Grotesk Bold / 32px / -0.02em tracking / leading 1.2
- H2 (Section Headers): Space Grotesk Semibold / 24px / -0.01em tracking / leading 1.3
- H3 (Card Titles): Space Grotesk Medium / 18px / normal tracking / leading 1.4
- Body (General Text): Inter Regular / 15px / normal tracking / leading 1.6
- Small (Metadata, captions): Inter Regular / 13px / normal tracking / leading 1.5
- Data (Tables, numbers): Inter Medium / 14px / tabular-nums / leading 1.5

## Animations

Animations should feel **purposeful and crisp**—reinforcing institutional efficiency while adding moments of satisfaction during data entry and navigation. Use motion to guide attention to financial changes and system feedback.

- Sidebar collapse/expand with smooth 300ms ease-in-out
- Dashboard cards fade-in-up on load (staggered 80ms delay)
- Chart animations: donut chart draws over 800ms, line chart paths animate over 1000ms
- Form submissions trigger success checkmark animation (scale + opacity)
- Expense status changes flash subtle highlight (200ms pulse)
- Hover states on interactive elements: gentle 150ms scale (1.02x) and shadow increase
- Page transitions: 250ms fade with subtle vertical shift

## Component Selection

**Components**:
- **Sidebar**: shadcn Sidebar component for collapsible navigation with role-based menu items
- **Card**: shadcn Card for dashboard metrics, KPI displays, and content sections
- **Button**: shadcn Button with variants (default, outline, ghost) for actions throughout
- **Dialog**: shadcn Dialog for expense entry forms, creditor management, and confirmations
- **Table**: shadcn Table with sorting and filtering for reports and expense lists
- **Form**: shadcn Form with react-hook-form integration for all data entry
- **Select**: shadcn Select for creditor/category dropdowns with search capability
- **Input**: shadcn Input for text/number fields with proper validation states
- **Calendar**: shadcn Calendar via react-day-picker for date selection
- **Badge**: shadcn Badge for status indicators (Paid/Pending, Fixed/Variable)
- **Alert**: shadcn Alert for system notifications and due date warnings
- **Tabs**: shadcn Tabs for switching between dashboard views (Overview, Forecast, Reports)
- **Toast**: Sonner for success/error feedback on CRUD operations

**Customizations**:
- Custom dashboard metric cards with large typography and icon accents from @phosphor-icons/react
- Custom donut and line charts using Recharts library with branded color scheme
- Custom sidebar header with institution logo placeholder and collapse toggle
- Enhanced table component with inline row actions and status cell renderers
- Custom expense status toggle (Paid/Pending) with visual feedback animation

**States**:
- Buttons: Default solid navy, hover with subtle scale and darker shade, active with ring, disabled with reduced opacity
- Inputs: Border gray on default, teal ring on focus, red border on error with shake animation
- Table rows: Hover with light background, selected row with teal left border accent
- Status badges: Green for Paid, amber for Pending, red for Overdue with pulsing animation
- Sidebar items: Ghost button style, active item with navy background and white text

**Icon Selection**:
- ChartPieSlice: Dashboard/BI section
- Wallet: Expenses/transactions
- Users: Creditors management
- Folders: Categories
- TrendUp: Forecasting
- FileText: Reports
- User: Profile/authentication
- Plus: Add new records
- X: Close/cancel actions
- MagnifyingGlass: Search functionality
- CaretRight/CaretLeft: Sidebar toggle
- Warning: Alerts and overdue indicators

**Spacing**:
- Page padding: px-6 py-8
- Card padding: p-6
- Form field gaps: gap-4
- Dashboard grid: gap-6
- Table cell padding: px-4 py-3
- Button padding: px-4 py-2 (default), px-6 py-3 (large)
- Section margins: mb-8

**Mobile**:
- Sidebar converts to slide-over drawer on screens < 768px
- Dashboard cards stack vertically with full width
- Charts maintain aspect ratio with responsive width
- Tables scroll horizontally with sticky first column
- Forms convert to single-column layout
- Action buttons stack vertically on mobile
- Navigation moved to bottom tab bar on mobile
- Metric cards show abbreviated labels on small screens

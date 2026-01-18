# Build Fix Implementation Plan

## Objective
Resolve all Prisma-related build errors and other type safety issues to ensure a successful production build of the Revlo VR application.

## Completed Actions

### 1. Prisma Schema & API Alignments
- **Manufacturing Sales API (`app/api/manufacturing/sales/route.ts`)**: 
  - Fixed error handling in `catch` block by casting `error` to `Error` type.
- **Reports Debts API (`app/api/reports/debts/route.ts`)**:
  - Commented out `vendor` includes as the `vendor` relation on `Transaction` is currently disabled in the schema.
  - Replaced/Commented out direct access to `transaction.vendor` and `expense.vendor`.
- **Shop Accounting Payables (`app/api/shop/accounting/payables/route.ts`)**: 
  - Updated `where` clause to filter `PurchaseOrder` by `user: { companyId }` instead of direct `companyId`.
- **Shop Accounting Receivables (`app/api/shop/accounting/receivables/route.ts`)**:
  - Updated `where` clause to filter `Sale` by `user: { companyId }`.
  - Added explicit types to `reduce` function to resolve implicit `any` error.
- **Shop Accounting Tax (`app/api/shop/accounting/tax/route.ts`)**:
  - Updated `Sale` and `PurchaseOrder` queries to use nested `user: { companyId }` filter.
- **Shop Receivables (`app/api/shop/receivables/route.ts`)**:
  - Updated `ShopClient` query to use `user: { companyId }`.
  - Added explicit types to `reduce` accumulator and item.
- **Shop Vendor Update (`app/api/shop/vendors/[id]/route.ts`)**:
  - Mapped `companyName` from request body to `name` field in `ShopVendor` update.
- **Vendor API (`app/api/vendors/[id]/route.ts`)**:
  - Removed invalid `project` include in `purchaseOrders` query.

### 2. Frontend Type Safety Fixes
- **Inventory Add Page (`app/shop/inventory/add/page.tsx`)**:
  - Removed unsupported `duration` and `className` properties from `toast` function call.
- **Manual Entry Page (`app/shop/manual-entry/page.tsx`)**:
  - Simplified `required` prop on select element to fix type mismatch warning (`"Cash" | "Card"` vs `"Credit"`).
- **Profile Page (`app/shop/profile/page.tsx`)**:
  - Added explicit check for `session.user` existence.
  - Added type casting to `session.user` to allow access to custom properties (`role`, `companyName`, etc.).
- **Settings Page (`app/shop/settings/page.tsx`)**:
  - Replaced invalid `color` prop with correct `variant` prop for `UltraIcon` component.
- **Main Layout (`components/layouts/Layout.tsx`)**:
  - Added missing `setIsSidebarOpen` prop to desktop `Sidebar` instance.

### 3. Script Updates
- **Debug Balance Sheet (`scripts/debug-balance-sheet.ts`)**:
  - Renamed `financialAccount` to `account`.
  - Updated `userId` filters to `companyId` where appropriate.
  - Removed reference to non-existent `totalInvested` field on `Shareholder`.

### 4. Static Export Fixes
- **Add Expense Page (`app/expenses/add/page.tsx`)**:
  - Wrapped the component in a `Suspense` boundary to properly handle `useSearchParams` during static export.

## Result
- **Build Status**: SUCCESS (`npm run build` completed with Exit Code 0).
- **PWA**: PWA service worker generation and static page generation completed successfully.

## Next Steps
- Address remaining non-blocking lint warnings (useEffect dependencies, image optimization).
- Deploy to production environment.

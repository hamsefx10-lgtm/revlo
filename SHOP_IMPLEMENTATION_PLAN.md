# Qorshaha Hirgelinta Qaybta Dukaamada (Shop Module Implementation Plan)

Qorshahan wuxuu qeexayaa sida aan u samaynayno nidaam gaar ah oo loogu talagalay Dukaamada (Shops/Retailers) kaas oo ka madax banaan qaybaha kale ee Warshadaha iyo Mashaariicda.

## 1. Isbedelada Database-ka (Database Changes)

Waa inaan `schema.prisma` ku darno nooc cusub oo Shirkadeed ah.

*   **Model:** `Company`
*   **Field:** `planType`
*   **New Value:** `SHOPS_ONLY` (hadda waxaa jira `PROJECTS_ONLY`, `FACTORIES_ONLY`, `COMBINED`).

## 2. Nidaamka Diiwaan-gelinta & Luuqadaha (Auth & Localization)

*   **Page:** `app/signup/page.tsx`
*   **Action:** Ku dar button "Dukaan/Shop".
*   **Localization:** Dhammaan bogagga waa inay taageeraan **Somali** (Default) iyo **English**. Waxaan isticmaali doonnaa `next-intl` ama Context fudud oo lagu kala badalo luuqadaha.
*   **Design:** Naqshadu waa inay noqotaa mid heer sare ah (Premium), leh Animations, Glassmorphism, iyo midabo soo jiidasho leh oo mashruuca la jaanqaadaya.

## 3. Qaab-dhismeedka Folder-ada (Folder Structure)

Waxaan samaynaynaa `Root Route` cusub oo la yiraahdo `app/shop` oo leh qaab dhismeed dhammaystiran.

```text
app/
├── shop/
│   ├── layout.tsx             <-- Layout gaar ah (Sidebar/Header leh Language Toggle)
│   ├── page.tsx               <-- Redirect
│   ├── dashboard/             <-- Main Dashboard (Live Metrics)
│   ├── pos/                   <-- Point of Sale (Supermarket Mode)
│   ├── manual-entry/          <-- Xaraynta Rasiidyada (Wholesale Mode)
│   ├── inventory/             <-- Stock Management
│   ├── sales/                 <-- Sales History & Invoices
│   ├── purchases/             <-- Soo Iibinta Alaabta (Stock In)
│   ├── customers/             <-- Macaamiisha & Daymaha
│   ├── vendors/               <-- Suppliers Management
│   ├── employees/             <-- Staff & Permissions
│   ├── accounting/            <-- NEW: Qaybta Xisaabaadka
│   │   ├── page.tsx           <-- Accounts Overview
│   │   ├── transactions/      <-- All financial movements
│   │   └── expenses/          <-- Maamulka Kharashaadka
│   ├── reports/               <-- NEW: Warbixino Dhammaystiran
│   │   ├── page.tsx           <-- Reports Dashboard
│   │   ├── profit-loss/       <-- Fa'iido iyo Khasaare
│   │   ├── sales-report/      <-- Warbixinta Iibka
│   │   ├── inventory-report/  <-- Warbixinta Kaydka
│   │   └── expense-report/    <-- Warbixinta Kharashka
│   └── settings/              <-- Configuration
```

## 4. Faahfaahinta Bogagga (Pages Breakdown)

Halkan waa liiska bogagga aan u baahanahay iyo shaqadooda:

### 1. Shop Dashboard (`/shop/dashboard`)
*   **Qeexitaan:** Bogga ugu horeeya ee laga arko xaalada ganacsiga.
*   **Features:**
    *   Total Sales (Maanta).
    *   Total Profit (Macaashka).
    *   Low Stock Alerts (Alaabta sii dhamaanaysa).
    *   Recent Transactions (Dhaqdhaqaaqyadii ugu dambeeyay).

### 2. Point of Sale (POS) (`/shop/pos`)
*   **Qeexitaan:** Waa bogga ugu muhiimsan dukaanlaha, halkaas oo si degdeg ah alaabta loogu iibiyo.
*   **Features:**
    *   Barcode Scanner support (hadii loo baahdo).
    *   Product Search (Raadinta alaabta).
    *   Cart (Dambiil).
    *   Checkout (Lacag bixin & Receipt Printing).

### 3. Inventory (`/shop/inventory`)
*   **Qeexitaan:** Maamulka alaabta dukaanka taal.
*   **Features:**
    *   Add Product (Magaca, Qiimaha Iibka, Qiimaha Gadashada, Quantity).
    *   Category Management.
    *   Stock Adjustments (Badeecad xumaatay ama luntay).

### 4. Sales History (`/shop/sales`)
*   **Qeexitaan:** Taariikhda iibka oo dhammaystiran.
*   **Features:**
    *   Liiska Invoice-yada.
    *   Refunds/Returns (badeecad lasoo celiyay).
    *   Filter by Date/Customer.

### 5. Customers (`/shop/customers`)
*   **Qeexitaan:** Xogta dadka wax ka iibsada (optional for basic retail, important for credit/dayn).
*   **Features:**
    *   Add Customer.
    *   Customer Ledger (Xisaabta macmiilka haduu dayn qabo).

### 6. Vendors (`/shop/vendors`)
*   **Qeexitaan:** Dadka alaabta laga soo,ibsado (Jumladlayda).
*   **Features:**
    *   Vendor List.
    *   Purchase Orders (Dalab alaab).

### 7. Accounting (Xisaabaadka) (`/shop/accounting`)
*   **Qeexitaan:** Maamulka lacagaha iyo xisaabaadka bangiyada/khasnadda.
*   **Features:**
    *   **Accounts List:** Liiska Khasnadaha (Cash) iyo Bangiyada (Zaad, Edahab, Bank).
    *   **Transactions:** Dhaqdhaqaaqa lacagaha (Deposit, Withdraw, Transfer).
    *   **Expenses:** Diiwaangelinta kharashaadka (Kirada, Korontada, etc.).

### 8. Reports (Warbixinada) (`/shop/reports`)
*   **Qeexitaan:** Xarunta ogaanshaha xaaladda ganacsiga. Waa inay u kala baxdaa qaybo badan:
    *   **Profit & Loss (P&L):** Warbixinta ugu muhiimsan. (Sales - COGS - Expenses = Net Profit).
    *   **Sales Report:** Iibka oo kala saaran (Daily, Weekly, Monthly, by Item, by Category).
    *   **Inventory Report:** Qiimaha alaabta taal (Stock Value), Low Stock, iyo Expiry Report.
    *   **Customer Balances:** Dadka lacagaha lagu leeyahay (Receivables).
    *   **Vendor Balances:** Dadka lacagaha loo hayo (Payables).
    *   **Expense Report:** Kharashaadka oo kala saaran (Category wise).

### 9. Manual Receipt Entry (`/shop/manual-entry`)
*   **Qeexitaan:** Bogga loogu talagalay in lagu xareeyo rasiidyada buugaagta (Bulk/Batch Entry).
*   **Features:** Fomu degdeg ah (Fast Form) oo keyboard-ka kaliya lagu isticmaali karo.

### 10. Settings & Localization
*   **Luuqadaha:** Awooda in hal click lagu badalo Af-Soomaali iyo English.
*   **Customize:** Invoice Logo, Tax Rates, Currency Settings.

## 5. Tallaabooyinka Xiga (Next Steps) - Updated

1.  **Database:** Update `schema.prisma`.
2.  **Auth:** Update SignUp page for "Shop" selection.
3.  **Layout:** Create `app/shop/layout.tsx` with Premium Design & Sidebar.
4.  **Core Pages:** Build Dashboard, Accounting, and Reports structure.
5.  **Features:** Implement POS and Inventory.

# Qorshaha Bulk Import-ka Categories-ka

## 1. **API Endpoint - Bulk Import**

**Path:** `/api/expenses/categories/bulk`

**Method:** `POST`

**Request Body:**
```json
{
  "categories": [
    {
      "name": "Material",
      "type": "Project",
      "description": "Material expenses for projects"
    },
    {
      "name": "Office Supplies",
      "type": "Company",
      "description": "Office supplies and equipment"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "total": 10,
  "created": 8,
  "skipped": 2,
  "errors": [
    {
      "row": 3,
      "name": "Material",
      "error": "Category already exists"
    }
  ],
  "categories": [...]
}
```

## 2. **CSV Format**

**Template File:** `categories_template.csv`
```csv
Name,Type,Description
Material,Project,Material expenses for projects
Office Supplies,Company,Office supplies and equipment
Labor,Project,Employee labor costs
Transport,Project,Transportation expenses
```

**Columns:**
- `Name` (required) - Magaca category-ka
- `Type` (required) - "Project" ama "Company"
- `Description` (optional) - Sharaxaad

## 3. **UI Components**

### A. Import Button
- Location: Settings > Categories page
- Button: "Bulk Import Categories" (icon: Upload)
- Opens modal with upload interface

### B. Upload Modal
- Drag & drop file area
- File input (CSV/Excel)
- Preview table (before import)
- Validation errors display
- Import button

### C. Preview Table
- Shows all categories to be imported
- Highlights duplicates (yellow)
- Highlights errors (red)
- Shows which will be created (green)

### D. Results Summary
- Total categories processed
- Successfully created
- Skipped (duplicates)
- Errors with details

## 4. **Validation Rules**

1. **Name:** Required, unique per company
2. **Type:** Required, must be "Project" or "Company"
3. **Description:** Optional
4. **Duplicate Check:** If category exists, skip with message
5. **Company Context:** All categories linked to user's company

## 5. **Error Handling**

- Invalid file format → Show error
- Missing required fields → Highlight in preview
- Duplicate names → Skip with warning
- Server errors → Show specific error message

## 6. **Implementation Steps**

### Step 1: Create Bulk Import API
- `/api/expenses/categories/bulk/route.ts`
- Accept array of categories
- Validate each category
- Create in batch (or one by one with error tracking)
- Return detailed results

### Step 2: Add CSV Parser
- Use `papaparse` library for CSV parsing
- Handle Excel files (convert to CSV first or use `xlsx` library)
- Validate CSV structure

### Step 3: Create Import UI
- Add "Bulk Import" button to categories page
- Create upload modal component
- Add preview table
- Add results summary

### Step 4: Add Download Template
- Create CSV template file
- Add "Download Template" button
- Pre-filled with example data

## 7. **User Flow**

1. User clicks "Bulk Import Categories"
2. Modal opens with upload area
3. User uploads CSV/Excel file
4. System parses and validates
5. Preview table shows (with errors highlighted)
6. User reviews and clicks "Import"
7. System processes import
8. Results summary shows:
   - ✅ Created: 8 categories
   - ⚠️ Skipped: 2 (duplicates)
   - ❌ Errors: 0
9. Page refreshes to show new categories

## 8. **Technical Details**

### Libraries Needed:
- `papaparse` - CSV parsing
- `xlsx` (optional) - Excel file support

### API Logic:
```typescript
// Pseudo-code
1. Get companyId from session
2. Loop through categories array
3. For each category:
   - Validate name and type
   - Check if exists (name + companyId)
   - If exists: skip, add to skipped array
   - If not exists: create, add to created array
   - If error: add to errors array
4. Return summary with all arrays
```

### File Upload:
- Max file size: 5MB
- Supported formats: CSV, XLSX
- Encoding: UTF-8

## 9. **Benefits**

✅ **Time Saving:** Import 100+ categories in seconds
✅ **Consistency:** Standardized format
✅ **Error Prevention:** Validation before import
✅ **Flexibility:** Can re-import with updates
✅ **Audit Trail:** Track what was imported when

## 10. **Future Enhancements**

- Export existing categories to CSV
- Update existing categories via import
- Import with subcategories
- Category mapping (old name → new name)
- Scheduled imports


# Deals Table Component System

This document describes the table component system created for the Deals page, following the Figma design specifications.

## Components Overview

### 1. Avatar Component (`avatar.tsx`)
A reusable avatar component with fallback support.

**Props:**
- `size`: "sm" | "md" | "lg" - Size of the avatar
- `fallback`: string - Text to show if image fails to load
- Standard img element props

**Usage:**
```tsx
<Avatar 
  src="https://example.com/avatar.jpg"
  alt="John Doe"
  size="sm"
  fallback="JD"
/>
```

### 2. Table Deals Components (`table-deals.tsx`)

A comprehensive set of specialized cell components for the Deals table.

#### Cell Components

##### TableCellText
Basic text cell for displaying simple text values.
```tsx
<TableCellText>Campus Planning 2026</TableCellText>
```

##### TableCellStage
Displays stage badges (L1, L2, L3) with appropriate styling.
```tsx
<TableCellStage stage="L1" />
```

##### TableCellAvatar
Shows user avatar with name.
```tsx
<TableCellAvatar 
  name="Makenna Canter" 
  avatar="https://..." 
/>
```

##### TableCellProbability
Displays probability as a colored gradient scale.
- High: Full spectrum (green → yellow → red)
- Medium: Partial spectrum (yellow → red)
- Low: Red only

```tsx
<TableCellProbability score="High" />
```

##### TableCellRoles
Shows multiple role badges in a flex-wrapped layout with quantity counts.
```tsx
<TableCellRoles roles={[
  { role: "PM", count: 1 },
  { role: "Eng", count: 3 },
  { role: "UX", count: 2 }
]} />
```
When count is greater than 1, displays as "3x Eng". Single roles show without count.

##### TableCellAlerts
Displays alert badges with icons.
```tsx
<TableCellAlerts alerts={["Data", "Deadline"]} />
```

##### TableCellNotes
Shows note count with optional "new notes" indicator.
```tsx
<TableCellNotes count={2} hasNew={true} />
```

##### TableCellActions
Action menu button (typically dropdown).
```tsx
<TableCellActions onAction={() => handleAction()} />
```

#### TableDealsRow Component

A complete row component that uses all the cell components internally.

**Props:**
- `deal`: DealData object
- `onAction`: Optional callback for action button

**DealData Type:**
```typescript
interface RoleCount {
  role: "PM" | "Eng" | "UX" | "QA"
  count: number
}

interface DealData {
  id: string
  name: string
  client: string
  stage: "L1" | "L2" | "L3"
  owner: {
    name: string
    avatar?: string
  }
  startDate: string
  endDate: string
  probability: "High" | "Medium" | "Low"
  roles: RoleCount[]
  alerts?: ("Data" | "Deadline")[]
  notesCount?: number
  hasNewNotes?: boolean
}
```

**Usage:**
```tsx
<TableDealsRow 
  deal={dealData}
  onAction={() => console.log('Action clicked')}
/>
```

## Storybook

All components have comprehensive Storybook documentation:

- **UI/Avatar** - Avatar component variants
- **UI/Table/Deals** - Deals table components including:
  - Individual cell components showcase
  - Single row example
  - Multiple rows example
  - Minimal data row
  - Full-featured row

## Integration with DealsPage

The DealsPage uses these components within collapsible sections (L1, L2, L3):

```tsx
<CollapsibleContent>
  {l1Deals.length > 0 ? (
    <div className="px-2">
      <table className="w-full">
        <tbody>
          {l1Deals.map((deal) => (
            <TableDealsRow
              key={deal.id}
              deal={deal}
              onAction={() => handleAction(deal)}
            />
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <EmptyState />
  )}
</CollapsibleContent>
```

## Design System Integration

### Colors
The components use the following custom colors defined in the design system:
- `electric-blue-50` - Light blue background for badges
- `electric-blue-600` - Blue text for stage badges
- `orange-100`, `orange-500` - Alert badge colors

### Typography
- Font family: Geist Sans (Medium weight for most labels)
- Font sizes: `text-xs` (12px) for badges, `text-sm` (14px) for cell content

### Spacing
- Cell padding: `px-2` (8px horizontal)
- Row height: `h-[52px]`
- Badge height: `h-6` (24px)

## Mock Data Controller

A floating button component for testing table behavior in prototype mode.

**Location:** `mock-data-controller.tsx`

**Features:**
- Floating button (bottom-left corner)
- Dark theme popover
- Controls for L1, L2, L3 row counts (0-15 per section)
- Plus/minus buttons and direct input
- Cancel/Save actions

**Usage in DealsPage:**
```tsx
<MockDataController
  l1Count={l1MockCount}
  l2Count={l2MockCount}
  l3Count={l3MockCount}
  onSave={(l1, l2, l3) => {
    setL1MockCount(l1)
    setL2MockCount(l2)
    setL3MockCount(l3)
  }}
/>
```

## Mock Data Generation

The DealsPage includes a `generateMockDeals()` function that creates realistic test data:

**Features:**
- 8 consistent owners with unique avatars
- 25 varied deal names
- Multiple client companies
- Varied date ranges (Jan 2026 - Aug 2026)
- Mixed probability levels (High, Medium, Low)
- Role counts showing quantity needs (e.g., "3x Eng", "2x UX")
- Random alerts and notes

**Owners:**
1. Makenna Canter
2. Skylar Dorwart
3. Brandon Aminoff
4. Aspen Carder
5. Ryan Geidt
6. Nolan Siphron
7. Jordan Ellis
8. Taylor Chen

## Best Practices

1. **Reusability**: Use individual cell components for custom layouts
2. **Type Safety**: Always use the provided TypeScript types
3. **Empty States**: Always handle empty states gracefully
4. **Accessibility**: Avatar components include fallbacks for failed images
5. **Performance**: Use React keys when mapping over deals arrays
6. **Role Counts**: Always provide count property in role objects, even if count is 1

## Future Enhancements

Potential improvements to consider:
- Add sorting functionality to cell headers
- Implement inline editing for cells
- Add drag-and-drop for row reordering
- Implement filtering within collapsible sections
- Add pagination for large datasets

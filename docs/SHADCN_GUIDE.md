# Adding Shadcn Components to Rocky Monorepo

This guide explains how to add shadcn/ui components to the Rocky AIMCS monorepo using the canonical monorepo pattern.

## Architecture Overview

```
packages/ui/                      # Shared UI component library
├── src/
│   ├── components/              # All shadcn components live here
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   └── ...
│   ├── lib/
│   │   └── utils.ts             # cn() utility
│   └── styles/
│       └── globals.css          # Global styles + CSS variables
├── components.json               # Shadcn config for UI package
└── package.json                 # Exports: @rocky/ui/components/*

apps/web/                        # Next.js admin panel
├── components.json              # Points to @rocky/ui/components
└── app/
    └── layout.tsx              # Imports: @rocky/ui/globals.css
```

## Current Components

✅ **Installed:**
- badge
- button
- card
- dialog
- dropdown-menu
- ds (design system)
- form
- input
- label
- select
- sonner (toasts)
- table
- textarea

## How to Add New Components

### Method 1: From UI Package (Recommended)

**Always run from `packages/ui/`:**

```bash
cd packages/ui
npx shadcn@latest add <component-name>
```

**Example:**
```bash
cd packages/ui
npx shadcn@latest add alert
```

**What happens:**
1. Component installs to `packages/ui/src/components/alert.tsx`
2. Dependencies added to `packages/ui/package.json`
3. Available in all apps immediately

**Multiple components:**
```bash
cd packages/ui
npx shadcn@latest add tooltip popover command calendar
```

### Method 2: From Web App (Advanced)

```bash
cd apps/web
npx shadcn@latest add <component-name>
```

**Note:** This method requires `components.json` aliases to be properly configured. Currently, Method 1 is more reliable.

## Available Components

Run this to see all available components:

```bash
cd packages/ui
npx shadcn@latest add --help
# Or visit: https://ui.shadcn.com/docs/components
```

## Common Rocky Components

Based on AIMCS domain needs, here are recommended components:

### Data Display
```bash
npx shadcn@latest add table      # ✅ Already installed
npx shadcn@latest add card       # ✅ Already installed
npx shadcn@latest add badge      # ✅ Already installed
npx shadcn@latest add separator  # For sections
npx shadcn@latest add avatar     # User initials
npx shadcn@latest add calendar   # Date picking
```

### Forms & Inputs
```bash
npx shadcn@latest add input      # ✅ Already installed
npx shadcn@latest add textarea   # ✅ Already installed
npx shadcn@latest add select     # ✅ Already installed
npx shadcn@latest add checkbox   # For confirmations
npx shadcn@latest add radio-group # For enums
npx shadcn@latest add form       # ✅ Already installed
npx shadcn@latest add label      # ✅ Already installed
```

### Feedback & Notifications
```bash
npx shadcn@latest add alert      # For errors/warnings
npx shadcn@latest add toast      # For success messages
npx shadcn@latest add sonner     # ✅ Already installed (toast)
npx shadcn@latest add progress   # For loading states
npx shadcn@latest add skeleton   # For loading placeholders
```

### Navigation & Overlays
```bash
npx shadcn@latest add dialog     # ✅ Already installed
npx shadcn@latest add dropdown-menu # ✅ Already installed
npx shadcn@latest add tabs       # For multi-pane views
npx shadcn@latest add tooltip    # Help text
npx shadcn@latest add popover    # Context menus
npx shadcn@latest add sheet      # Side panels
```

### Actions
```bash
npx shadcn@latest add button     # ✅ Already installed
npx shadcn@latest add command    # Keyboard shortcuts (Cmd+K)
npx shadcn@latest add context-menu # Right-click menus
```

## Usage Examples

### In Web App (apps/web)

```tsx
// apps/web/app/farms/page.tsx
import { Button } from "@rocky/ui/components/button";
import { Card } from "@rocky/ui/components/card";
import { Table } from "@rocky/ui/components/table";

export default function FarmsPage() {
  return (
    <Card>
      <Table>
        {/* Farm data */}
      </Table>
      <Button>Add Farm</Button>
    </Card>
  );
}
```

### In Mobile App (apps/mobile)

```tsx
// apps/mobile/components/FarmCard.tsx
import { Card } from "@rocky/ui/components/card";
import { Badge } from "@rocky/ui/components/badge";

export function FarmCard({ farm }: { farm: Farm }) {
  return (
    <Card>
      <Badge>{farm.status}</Badge>
      {/* Farm details */}
    </Card>
  );
}
```

### In Admin Panel (apps/mdx-shadcn)

```tsx
// apps/mdx-shadcn/components/MovementTable.tsx
import { Table } from "@rocky/ui/components/table";
import { DropdownMenu } from "@rocky/ui/components/dropdown-menu";

export function MovementTable() {
  return (
    <Table>
      {/* Movement data */}
      <DropdownMenu>
        {/* Actions */}
      </DropdownMenu>
    </Table>
  );
}
```

## Customizing Components

### Override Component Styles

Create a wrapper component in your app:

```tsx
// apps/web/components/ui/farm-card.tsx
import { Card } from "@rocky/ui/components/card";
import { cn } from "@rocky/ui/lib/utils";

interface FarmCardProps extends React.ComponentProps<typeof Card> {
  variant?: "default" | "compact";
}

export function FarmCard({ variant = "default", className, ...props }: FarmCardProps) {
  return (
    <Card
      className={cn(
        "border-l-4",
        variant === "compact" && "p-4",
        className
      )}
      {...props}
    />
  );
}
```

### Extend Component Variants

Add new variants to existing components:

```tsx
// apps/web/components/ui/button.tsx
import { Button as ShadcnButton } from "@rocky/ui/components/button";
import { cva } from "class-variance-authority";

const farmVariants = cva("", {
  variants: {
    intent: {
      primary: "bg-blue-600 hover:bg-blue-700",
      danger: "bg-red-600 hover:bg-red-700",
      success: "bg-green-600 hover:bg-green-700",
    },
  },
});

export function Button({ intent = "primary", ...props }) {
  return <ShadcnButton className={farmVariants({ intent })} {...props} />;
}
```

## Adding Icons

Rocky uses Lucide React. Icons are auto-imported:

```tsx
import { Cow, Truck, CheckCircle, AlertTriangle } from "lucide-react";

export function MovementStatus({ status }: { status: string }) {
  return (
    <div>
      {status === "completed" && <CheckCircle className="text-green-600" />}
      {status === "rejected" && <AlertTriangle className="text-red-600" />}
      {status === "in_transit" && <Truck className="text-blue-600" />}
      <Cow className="text-amber-600" /> {/* For animals */}
    </div>
  );
}
```

## Theme Customization

CSS variables are in `packages/ui/src/styles/globals.css`:

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --border: oklch(0.922 0 0);
  --radius: 0.625rem;

  /* Rocky-specific colors */
  --rocky-green: oklch(0.5 0.15 140);  /* For farms */
  --rocky-blue: oklch(0.55 0.18 240);   /* For animals */
  --rocky-red: oklch(0.55 0.20 25);     /* For alerts */
}
```

Use in components:

```tsx
<Button style={{ backgroundColor: "var(--rocky-green)" }}>
  Register Farm
</Button>
```

## Troubleshooting

### Component Not Found

**Problem:** `Cannot find module '@rocky/ui/components/card'`

**Solution:**
1. Ensure component exists: `ls packages/ui/src/components/`
2. Rebuild UI package: `cd packages/ui && pnpm build`
3. Restart dev server

### Styles Not Applying

**Problem:** Component renders but styles missing

**Solution:**
1. Check globals.css import in app layout:
   ```tsx
   // apps/web/app/layout.tsx
   import "@rocky/ui/globals.css";
   ```
2. Ensure Tailwind is processing the CSS file
3. Check `next.config.mjs` has `transpilePackages: ["@rocky/ui"]`

### TypeScript Errors

**Problem:** Type errors for shadcn components

**Solution:**
1. Rebuild UI package: `cd packages/ui && pnpm build`
2. Restart TypeScript server in your IDE
3. Check `packages/ui/tsconfig.json` exports

### Dependency Conflicts

**Problem:** `Cannot resolve dependency XYZ`

**Solution:**
1. Check `packages/ui/package.json` has the dependency
2. Run: `pnpm install` from monorepo root
3. Ensure `catalog:` is used for shared deps

## Best Practices

1. **Always add components from UI package:** `cd packages/ui && npx shadcn@latest add <name>`
2. **Use workspace dependencies:** Check `packages/ui/package.json` uses `catalog:`
3. **Import from shared package:** `import { Card } from "@rocky/ui/components/card"`
4. **Don't duplicate components:** Never add components directly to `apps/web/components/`
5. **Customize via wrappers:** Create wrapper components in your app, don't edit source
6. **Keep components generic:** Make UI package components reusable across all apps
7. **Add app-specific variants:** Extend component variants in app-level components

## Quick Reference

```bash
# Add component
cd packages/ui && npx shadcn@latest add <name>

# Rebuild UI package
cd packages/ui && pnpm build

# Restart dev server
pnpm --filter @rocky/web dev

# Check installed components
ls packages/ui/src/components/

# Update all components
cd packages/ui && npx shadcn@latest add --all --overwrite
```

## Resources

- **Shadcn Docs:** https://ui.shadcn.com/docs
- **Component Gallery:** https://ui.shadcn.com/docs/components
- **Theming:** https://ui.shadcn.com/docs/theming
- **Animation:** https://ui.shadcn.com/docs/animations
- **Lucide Icons:** https://lucide.dev/

# shadcn/ui Component Demo - Fluxon Branding Baseline

<!-- CI test: auto deploy -->
A clean React development environment showcasing default shadcn/ui components. This project serves as a visual baseline for testing how custom Fluxon branding (tokens, styles) will affect the component library.

## 🎯 Purpose

- **Baseline Reference**: View shadcn/ui components with their default styling
- **Branding Test Environment**: A foundation for applying and testing Fluxon brand tokens
- **Component Showcase**: Comprehensive demo of all common shadcn/ui components
- **Before/After Comparison**: Compare default vs. branded component appearances

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The demo page will be available at `http://localhost:5173/`

## 📦 Tech Stack

- **Framework**: Vite + React 18 + TypeScript
- **UI Library**: shadcn/ui (default components)
- **Styling**: Tailwind CSS v3
- **Icons**: Lucide React

## 🎨 Components Included

The demo page (`src/App.tsx`) showcases the following shadcn/ui components:

### Form Controls
- **Button** - All variants (default, secondary, outline, ghost, destructive, link) and sizes (sm, default, lg)
- **Input** - Text input fields
- **Textarea** - Multi-line text input
- **Select** - Dropdown selection
- **Checkbox** - Boolean selection
- **Radio Group** - Single selection from multiple options
- **Label** - Form field labels

### Layout & Structure
- **Card** - Content containers with header, body, and footer
- **Tabs** - Tabbed content organization

### Feedback & Interaction
- **Alert** - Information, error, success, and warning messages
- **Dialog/Modal** - Overlay dialogs for user interactions

### Data Display
- **Table** - Structured data display with headers and rows

## 📁 Project Structure

```
/Users/mikemalone/Fles/Cursor/Allox26/
├── src/
│   ├── components/
│   │   └── ui/              # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── textarea.tsx
│   │       ├── label.tsx
│   │       ├── select.tsx
│   │       ├── checkbox.tsx
│   │       ├── radio-group.tsx
│   │       ├── card.tsx
│   │       ├── tabs.tsx
│   │       ├── alert.tsx
│   │       ├── dialog.tsx
│   │       └── table.tsx
│   ├── lib/
│   │   └── utils.ts         # Utility functions (cn helper)
│   ├── App.tsx              # Main demo page
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles + Tailwind directives
├── components.json          # shadcn/ui configuration
├── tailwind.config.js       # Tailwind configuration
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite configuration
└── package.json             # Dependencies
```

## 🎨 Applying Fluxon Branding (Future Steps)

When ready to apply Fluxon branding, customize these areas:

### 1. Design Tokens (`src/index.css`)
```css
:root {
  /* Replace these CSS variables with Fluxon brand colors */
  --primary: 222.2 47.4% 11.2%;
  --secondary: 210 40% 96.1%;
  /* ... etc */
}
```

### 2. Tailwind Configuration (`tailwind.config.js`)
- Update color palette
- Customize font families
- Adjust spacing scale
- Modify border radius values

### 3. Component-Level Styling
Each component in `src/components/ui/` can be customized for brand-specific variants or behavior.

## 📝 Notes

- All components use **default shadcn/ui styling** - no custom branding applied yet
- Comments throughout `App.tsx` indicate where branding will be injected
- The project uses Tailwind CSS v3 for compatibility with shadcn/ui
- Path aliases configured: `@/components`, `@/lib` for clean imports

## 🔧 Configuration Files

- **components.json** - shadcn/ui component configuration and aliases
- **tailwind.config.js** - Tailwind theme configuration (colors, spacing, etc.)
- **postcss.config.js** - PostCSS plugins (Tailwind + Autoprefixer)
- **tsconfig.json** - TypeScript settings with path aliases
- **vite.config.ts** - Vite bundler configuration

## 📚 Resources

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)

---

**Status**: ✅ Ready for Fluxon branding application

<!-- chore: fix commit author for Vercel -->

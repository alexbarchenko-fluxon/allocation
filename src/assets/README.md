# Assets Folder Structure

This folder contains all static assets used in the Allox application.

## Folder Organization

```
src/assets/
├── logos/          # Brand logos and wordmarks
│   └── allox-logo.svg
├── icons/          # Custom icon assets (use lucide-react for standard icons)
└── images/         # Photos, illustrations, and other raster images
```

## Guidelines

### Logos (`logos/`)
- Store brand logos, wordmarks, and logo variations
- Use SVG format for scalability
- Name files descriptively: `{brand}-{variant}.svg`
- Example: `allox-logo.svg`, `allox-logo-dark.svg`

### Icons (`icons/`)
- Only custom icons that are not available in lucide-react
- Prefer SVG format
- Use consistent sizing (24x24px viewBox recommended)
- Name files with kebab-case: `custom-icon-name.svg`

### Images (`images/`)
- Photos, illustrations, and other raster graphics
- Use WebP format for better compression when possible
- Fallback to PNG for transparency, JPEG for photos
- Optimize images before committing

## Usage

### SVG as React Component
SVGs can be imported as React components using the `?react` suffix:

```tsx
import Logo from '@/assets/logos/allox-logo.svg?react'

function Header() {
  return <Logo className="h-8 w-auto text-foreground" />
}
```

### Regular Image Import
For raster images:

```tsx
import heroImage from '@/assets/images/hero.webp'

function Hero() {
  return <img src={heroImage} alt="Hero" />
}
```

## Best Practices

1. **Optimize before committing**: Use tools like SVGO for SVGs, ImageOptim for rasters
2. **Use semantic naming**: Names should describe what the asset is, not where it's used
3. **Include alt text**: Always provide meaningful alt text for accessibility
4. **Responsive images**: Consider multiple sizes for different screen densities
5. **Color inheritance**: For SVGs, use `currentColor` to inherit text color from parent

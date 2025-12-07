# GradientText Component

A beautiful animated gradient text component for React/Next.js applications.

## Features

- ✨ **Smooth Gradient Animation** - Animated gradient that flows across the text
- 🎨 **Customizable Colors** - Define your own color palette
- ⚡ **Adjustable Speed** - Control animation speed
- 🎯 **Optional Border** - Add an animated gradient border
- 📱 **Fully Responsive** - Works on all screen sizes
- 🔧 **TypeScript Support** - Full type safety

## Installation

The component is already installed in your project at:
- `src/app/components/GradientText.tsx`
- `src/app/components/GradientText.css`

## Usage

### Basic Usage

```tsx
import GradientText from './components/GradientText';

function MyComponent() {
  return (
    <GradientText>
      Add a splash of color!
    </GradientText>
  );
}
```

### With Custom Colors

```tsx
<GradientText
  colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]}
  animationSpeed={3}
>
  Custom Gradient Text
</GradientText>
```

### With Border Effect

```tsx
<GradientText
  colors={["#ff0080", "#ff8c00", "#40e0d0"]}
  animationSpeed={5}
  showBorder={true}
  className="my-custom-class"
>
  Bordered Gradient Text
</GradientText>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | Required | The text content to display |
| `className` | `string` | `''` | Additional CSS classes |
| `colors` | `string[]` | `['#40ffaa', '#4079ff', ...]` | Array of color values for the gradient |
| `animationSpeed` | `number` | `8` | Animation duration in seconds |
| `showBorder` | `boolean` | `false` | Whether to show animated border |

## Color Tips

For a smoother animation, the gradient should **start and end with the same color**:

✅ **Good** (smooth loop):
```tsx
colors={["#40ffaa", "#4079ff", "#40ffaa"]}
```

❌ **Not ideal** (visible jump):
```tsx
colors={["#40ffaa", "#4079ff", "#ff0080"]}
```

## Examples

### Brand Colors (Teal to Blue)
```tsx
<GradientText
  colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]}
  animationSpeed={3}
>
  Bizz Co Hub
</GradientText>
```

### Sunset Colors
```tsx
<GradientText
  colors={["#ff6b6b", "#feca57", "#ff6b6b"]}
  animationSpeed={4}
>
  Sunset Vibes
</GradientText>
```

### Ocean Colors
```tsx
<GradientText
  colors={["#0077be", "#00d4ff", "#0077be"]}
  animationSpeed={6}
>
  Ocean Waves
</GradientText>
```

### Rainbow
```tsx
<GradientText
  colors={["#ff0080", "#ff8c00", "#40e0d0", "#ff0080"]}
  animationSpeed={5}
  showBorder={true}
>
  Rainbow Magic
</GradientText>
```

## Current Usage

The GradientText component is currently used in:

### Header Logo
Located in `src/app/components/Header.tsx`:

```tsx
<GradientText
  colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]}
  animationSpeed={3}
  showBorder={false}
  className="logo-text"
>
  Bizz Co Hub
</GradientText>
```

## Customization

### Adjusting Font Size
The component inherits font size from the parent or className:

```tsx
<div style={{ fontSize: '48px' }}>
  <GradientText>Large Text</GradientText>
</div>
```

Or with CSS:
```css
.my-large-text {
  font-size: 48px;
  font-weight: 800;
}
```

```tsx
<GradientText className="my-large-text">
  Large Text
</GradientText>
```

### Changing Animation Direction
To reverse the animation direction, modify the `@keyframes gradient` in `GradientText.css`:

```css
@keyframes gradient {
  0% {
    background-position: 100% 50%;  /* Start from right */
  }
  50% {
    background-position: 0% 50%;    /* Move to left */
  }
  100% {
    background-position: 100% 50%;  /* Back to right */
  }
}
```

### Custom Border Color
The border uses the same gradient as the text. To customize it separately, modify the `gradient-overlay` styles in `GradientText.css`.

## Performance

- ✅ **GPU Accelerated** - Uses CSS transforms for smooth animations
- ✅ **Lightweight** - No heavy dependencies
- ✅ **Optimized** - Minimal re-renders

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

**Note**: Requires support for `background-clip: text` and CSS animations.

## Accessibility

The component maintains text readability and doesn't interfere with screen readers. The gradient is purely visual.

## Troubleshooting

### Gradient not showing
- Ensure the CSS file is imported: `import './GradientText.css'`
- Check that colors are valid CSS color values
- Verify the component has content (children)

### Animation not smooth
- Use matching start/end colors in the colors array
- Adjust `animationSpeed` (lower = faster, higher = slower)
- Ensure `background-size: 300% 100%` is set in CSS

### Border not appearing
- Set `showBorder={true}`
- Check that the border color contrasts with the background
- Adjust the `gradient-overlay::before` background color in CSS

## Advanced Usage

### Dynamic Colors
```tsx
const [colors, setColors] = useState(["#40ffaa", "#4079ff", "#40ffaa"]);

<GradientText colors={colors}>
  Dynamic Gradient
</GradientText>
```

### Responsive Animation Speed
```tsx
const isMobile = window.innerWidth < 768;

<GradientText animationSpeed={isMobile ? 5 : 3}>
  Responsive Speed
</GradientText>
```

## Credits

Based on the React Bits GradientText component, adapted for Next.js with TypeScript support.

## License

MIT - Free to use in your projects!

---

**Need help?** Check the component files:
- `src/app/components/GradientText.tsx` - Component logic
- `src/app/components/GradientText.css` - Styles and animations

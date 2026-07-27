TODAY COUNTERS REBUILT FROM ZERO — v74

- Removed the complete v71/v72/v73 counter implementation.
- Removed all old counter CSS selectors and patch overrides.
- Added an isolated AnimatedCircularCounter component with its own SCSS namespace.
- Uses requestAnimationFrame and controlled SVG stroke progress.
- Addition: draws clockwise from 12 o'clock back to 12 o'clock.
- Deletion: draws counterclockwise from 12 o'clock back to 12 o'clock.
- Starts after exactly 300 ms.
- Larger 72 px ring with a thicker 7 px progress stroke.
- Reduced saturation: muted green, amber and blue.
- Total remains the original simple gray pill.
- Counter CSS cannot affect intervention cards or their icons.

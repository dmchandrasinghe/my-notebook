# Resources

Place app icons here:

| File | Description |
|------|-------------|
| `icon.ico` | Windows installer icon (multi-size ICO, 256×256 recommended) |
| `icon.png` | 512×512 PNG source (electron-builder can convert to ICO) |

## Generating an ICO from PNG

```bash
# Install ImageMagick, then:
magick icon.png -define icon:auto-resize="256,128,96,64,48,32,16" icon.ico
```

Or use an online tool: https://convertico.com

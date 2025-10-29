# Bubblemarks Decorative Assets

Drop your sparkle GIFs, pastel stickers, or the wandering axolotl sprites into this folder.

The interface looks for:

- Optional star/heart GIFs referenced from CSS classes (see `style.css`). Drop a wide `stars.gif` for the ribbon borders and the trio `singlestar1.gif`, `singlestar2.gif`, `singlestar3.gif` for floating sparkles.
- The axolotl animation frames inside an `assets/axolotl/` subfolder. Create the folder and place your sequence inside to bring the mascot to life.

### Axolotl animation tips

- Drop a `manifest.json` inside `assets/axolotl/` with either an array (`["frame-01.png", "frame-02.png"]`) or `{ "frames": ["frame-01.png"] }` to define your exact frame order.
- No manifest? Bubblemarks will try friendly defaults like `frame-01.png`, `axolotl-01.png`, or `swim01.webp` (PNG/WEBP/GIF supported). A single looping `axolotl.gif` works as well.
- The mascot lazily swims across the viewport. Users who prefer reduced motion will see the little buddy settle in one cozy corner.

Because the repo is distributed without media, you can keep your licensed artwork private while the UI falls back to CSS-generated sparkles. Add the files locally and refresh to see them.

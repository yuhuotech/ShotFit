# Screenshot Resizer — Design Spec

**Date:** 2026-03-27
**Status:** Approved

## Overview

A single-page web tool for resizing screenshots to Apple App Store required dimensions. Built with Next.js + Tailwind CSS, processed entirely in the browser via Canvas API. No backend required.

## Requirements

- Upload 1 to 20 images (drag & drop or click to select), max 20MB each
- Only accept `image/png`, `image/jpeg`, `image/webp` files; reject others with an inline error message
- Select one target resolution from four App Store options (first option pre-selected on load)
- Resize all images via force-stretch (Canvas drawImage) to exact target dimensions
- Output format: PNG input → PNG output; JPEG input → JPEG output (quality 0.92); WEBP input → PNG output (Canvas does not reliably export WEBP)
- Output filename: `{original-basename}_{width}x{height}.{ext}` (e.g. `screen_1242x2688.png`)
- If two uploaded files share the same basename, append a numeric suffix to avoid ZIP collision (e.g. `screen_1242x2688_2.png`)
- Download all resized images as a single ZIP file named `screenshots_{width}x{height}.zip`
- No authentication, no server-side processing

## Target Resolutions

| Label | Width | Height |
|-------|-------|--------|
| iPhone 竖屏 | 1242px | 2688px |
| iPhone 横屏 | 2688px | 1242px |
| iPhone 竖屏 Pro | 1284px | 2778px |
| iPhone 横屏 Pro | 2778px | 1284px |

First option (1242×2688) is pre-selected when the page loads.

## Architecture

**Stack:** Next.js 14 (App Router) + Tailwind CSS
**Image processing:** Browser Canvas API (`drawImage` forced stretch)
**ZIP packaging:** `jszip`
**File download:** `file-saver`
**Target browsers:** Modern browsers (Chrome 90+, Safari 15+, Firefox 90+). No IE support.
**No API Routes needed**

## Page Layout (Single Page)

1. **Header** — title and brief description
2. **Upload zone** — drag & drop or click, supports multiple files
3. **Thumbnail list** — uploaded images with remove button per item; shows filename and file size
4. **Resolution selector** — radio buttons, 4 options, first pre-selected
5. **Action button** — "调整尺寸并下载 ZIP", disabled until at least one image is uploaded; shows loading spinner during processing

## Data Flow

1. User drops/selects files → validate type and size, reject invalid files with inline error
2. Valid files stored in React state as `{ id: string, file: File, previewUrl: string }[]`
3. Preview URLs created via `URL.createObjectURL(file)`
4. On button click:
   a. For each file: create `new Image()`, set `src = previewUrl`, wait for `onload`
   b. Create `<canvas>` at target width × height
   c. Call `ctx.drawImage(img, 0, 0, targetWidth, targetHeight)` (forced stretch)
   d. Call `canvas.toBlob(callback, mimeType, quality)` — mimeType from file.type (WEBP falls back to `image/png`), quality `0.92` for JPEG
   e. Revoke object URL and release canvas after blob is obtained
5. Collect all Blobs, add to JSZip with deduplicated filenames
6. Generate ZIP blob, trigger download via `file-saver`

## Error Handling

- Files with unsupported type: rejected at upload time with inline message "仅支持 PNG / JPG / WEBP 格式"
- Files exceeding 20MB: rejected with message "文件大小不能超过 20MB"
- More than 20 files: reject excess files with message "最多支持 20 张图片"
- Canvas export failure: show per-image error, continue processing remaining images
- Button shows spinner and "处理中…" text during ZIP generation; re-enabled after download

## Testing

- Upload 1 PNG, 1 JPG, 1 WEBP; select each of the 4 resolutions; verify ZIP contains correct files
- Open each output file and confirm pixel dimensions match target exactly
- Upload 2 files with the same filename; verify ZIP contains both with deduplicated names
- Upload a file > 20MB; verify rejection message appears
- Upload a non-image file (e.g. .txt); verify rejection message appears
- Verify JPEG output quality is visually acceptable (not over-compressed)
- Verify object URLs are revoked (no memory leak) — check via browser DevTools Memory tab

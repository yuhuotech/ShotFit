# Screenshot Resizer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page Next.js web app that batch-resizes uploaded screenshots to Apple App Store dimensions and downloads them as a ZIP.

**Architecture:** Pure client-side processing. Next.js App Router serves a single page. Canvas API resizes images (forced stretch). JSZip + file-saver packages and downloads results. No API routes, no server processing.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, jszip, file-saver, Jest, jest-canvas-mock, @testing-library/react

---

## File Map

| File | Responsibility |
|------|---------------|
| `app/layout.tsx` | Root HTML shell, Tailwind base |
| `app/page.tsx` | Assembles all components, owns state |
| `app/globals.css` | Tailwind directives |
| `components/UploadZone.tsx` | Drag-and-drop / click upload, validation |
| `components/ImageList.tsx` | Thumbnail grid with remove buttons |
| `components/ResolutionSelector.tsx` | Radio group for target resolution |
| `lib/types.ts` | Shared TypeScript interfaces |
| `lib/resizeImage.ts` | Canvas resize logic, returns Blob |
| `lib/buildZip.ts` | Filename deduplication + JSZip assembly |
| `__tests__/lib/resizeImage.test.ts` | Unit tests for resize function |
| `__tests__/lib/buildZip.test.ts` | Unit tests for ZIP/filename logic |
| `jest.config.ts` | Jest config (jsdom + canvas mock) |
| `jest.setup.ts` | jest-canvas-mock import |

---

## Task 1: Scaffold Next.js Project

**Files:**
- Create: project root (`package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`)

- [ ] **Step 1: Scaffold project**

Run in `/Users/hmw/data/www/scrennshot-resizer`:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --yes
```
Expected: Project files created, `npm run dev` works.

- [ ] **Step 2: Remove boilerplate**

Delete contents of `app/page.tsx` and replace with a placeholder `<main>hello</main>`.
Delete `app/globals.css` content except the three Tailwind directives:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```
Delete `public/` SVG files.

- [ ] **Step 3: Verify dev server starts**

```bash
npm run dev
```
Expected: Server starts on http://localhost:3000, page shows "hello".

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js project"
```

---

## Task 2: Install Dependencies and Configure Jest

**Files:**
- Modify: `package.json`
- Create: `jest.config.ts`, `jest.setup.ts`

- [ ] **Step 1: Install runtime dependencies**

```bash
npm install jszip file-saver
npm install --save-dev @types/file-saver
```

- [ ] **Step 2: Install test dependencies**

```bash
npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom ts-jest jest-canvas-mock @types/jest
```

- [ ] **Step 3: Create jest.config.ts**

```typescript
import type { Config } from 'jest'

const config: Config = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
}

export default config
```

- [ ] **Step 4: Create jest.setup.ts**

```typescript
import 'jest-canvas-mock'
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Add test script to package.json**

In `package.json`, add to `"scripts"`:
```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 6: Verify Jest runs**

```bash
npx jest --passWithNoTests
```
Expected: "Test Suites: 0 passed" — no errors.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: add jszip, file-saver, jest with canvas mock"
```

---

## Task 3: Define Shared Types

**Files:**
- Create: `lib/types.ts`

- [ ] **Step 1: Create types file**

```typescript
// lib/types.ts

export interface UploadedImage {
  id: string           // crypto.randomUUID()
  file: File
  previewUrl: string   // URL.createObjectURL(file)
  error?: string       // per-image error after processing
}

export interface Resolution {
  label: string
  width: number
  height: number
}

export const RESOLUTIONS: Resolution[] = [
  { label: 'iPhone 竖屏 (1242×2688)', width: 1242, height: 2688 },
  { label: 'iPhone 横屏 (2688×1242)', width: 2688, height: 1242 },
  { label: 'iPhone 竖屏 Pro (1284×2778)', width: 1284, height: 2778 },
  { label: 'iPhone 横屏 Pro (2778×1284)', width: 2778, height: 1284 },
]
```

- [ ] **Step 2: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add shared types and resolution constants"
```

---

## Task 4: Implement resizeImage Utility (TDD)

**Files:**
- Create: `lib/resizeImage.ts`
- Create: `__tests__/lib/resizeImage.test.ts`

- [ ] **Step 1: Write failing test**

Create `__tests__/lib/resizeImage.test.ts`:
```typescript
import { resizeImage } from '@/lib/resizeImage'

describe('resizeImage', () => {
  it('returns a Blob', async () => {
    const mockFile = new File([''], 'test.png', { type: 'image/png' })
    const blob = await resizeImage(mockFile, 1242, 2688)
    expect(blob).toBeInstanceOf(Blob)
  })

  it('returns jpeg mime type for jpeg input', async () => {
    const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' })
    const blob = await resizeImage(mockFile, 1242, 2688)
    expect(blob.type).toBe('image/jpeg')
  })

  it('returns png mime type for png input', async () => {
    const mockFile = new File([''], 'test.png', { type: 'image/png' })
    const blob = await resizeImage(mockFile, 1242, 2688)
    expect(blob.type).toBe('image/png')
  })

  it('returns png mime type for webp input (fallback)', async () => {
    const mockFile = new File([''], 'test.webp', { type: 'image/webp' })
    const blob = await resizeImage(mockFile, 1242, 2688)
    expect(blob.type).toBe('image/png')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest resizeImage --no-coverage
```
Expected: FAIL — "Cannot find module '@/lib/resizeImage'"

- [ ] **Step 3: Implement resizeImage**

Create `lib/resizeImage.ts`:
```typescript
export async function resizeImage(
  file: File,
  width: number,
  height: number
): Promise<Blob> {
  const mimeType = file.type === 'image/webp' ? 'image/png' : file.type
  const quality = mimeType === 'image/jpeg' ? 0.92 : undefined

  const objectUrl = URL.createObjectURL(file)

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl)
          if (blob) resolve(blob)
          else reject(new Error('Canvas toBlob returned null'))
        },
        mimeType,
        quality
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image'))
    }
    img.src = objectUrl
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest resizeImage --no-coverage
```
Expected: PASS — 4 tests passing.

- [ ] **Step 5: Commit**

```bash
git add lib/resizeImage.ts __tests__/lib/resizeImage.test.ts
git commit -m "feat: add resizeImage utility with Canvas forced-stretch"
```

---

## Task 5: Implement buildZip Utility (TDD)

**Files:**
- Create: `lib/buildZip.ts`
- Create: `__tests__/lib/buildZip.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/buildZip.test.ts`:
```typescript
import { buildOutputFilename, buildZipFilename } from '@/lib/buildZip'

describe('buildOutputFilename', () => {
  it('appends resolution to basename', () => {
    expect(buildOutputFilename('screen.png', 1242, 2688, new Map())).toBe(
      'screen_1242x2688.png'
    )
  })

  it('preserves jpeg extension', () => {
    expect(buildOutputFilename('photo.jpg', 1242, 2688, new Map())).toBe(
      'photo_1242x2688.jpg'
    )
  })

  it('uses png extension for webp input', () => {
    expect(buildOutputFilename('shot.webp', 1242, 2688, new Map())).toBe(
      'shot_1242x2688.png'
    )
  })

  it('deduplicates colliding names with numeric suffix', () => {
    const seen = new Map<string, number>([['screen_1242x2688.png', 1]])
    expect(buildOutputFilename('screen.png', 1242, 2688, seen)).toBe(
      'screen_1242x2688_2.png'
    )
  })

  it('increments suffix for multiple collisions', () => {
    const seen = new Map<string, number>([
      ['screen_1242x2688.png', 1],
      ['screen_1242x2688_2.png', 1],
    ])
    expect(buildOutputFilename('screen.png', 1242, 2688, seen)).toBe(
      'screen_1242x2688_3.png'
    )
  })
})

describe('buildZipFilename', () => {
  it('formats zip name with resolution', () => {
    expect(buildZipFilename(1242, 2688)).toBe('screenshots_1242x2688.zip')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest buildZip --no-coverage
```
Expected: FAIL — "Cannot find module '@/lib/buildZip'"

- [ ] **Step 3: Implement buildZip**

Create `lib/buildZip.ts`:
```typescript
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

export function buildOutputFilename(
  originalName: string,
  width: number,
  height: number,
  seen: Map<string, number>
): string {
  const dotIndex = originalName.lastIndexOf('.')
  const base = dotIndex !== -1 ? originalName.slice(0, dotIndex) : originalName
  const ext = originalName.endsWith('.webp')
    ? 'png'
    : dotIndex !== -1
    ? originalName.slice(dotIndex + 1)
    : 'png'

  const candidate = `${base}_${width}x${height}.${ext}`

  if (!seen.has(candidate)) {
    seen.set(candidate, 1)
    return candidate
  }

  let counter = 2
  while (true) {
    const name = `${base}_${width}x${height}_${counter}.${ext}`
    if (!seen.has(name)) {
      seen.set(name, 1)
      return name
    }
    counter++
  }
}

export function buildZipFilename(width: number, height: number): string {
  return `screenshots_${width}x${height}.zip`
}

export async function downloadAsZip(
  blobs: { blob: Blob; filename: string }[],
  zipFilename: string
): Promise<void> {
  const zip = new JSZip()
  for (const { blob, filename } of blobs) {
    zip.file(filename, blob)
  }
  const zipBlob = await zip.generateAsync({ type: 'blob' })
  saveAs(zipBlob, zipFilename)
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest buildZip --no-coverage
```
Expected: PASS — 6 tests passing.

- [ ] **Step 5: Commit**

```bash
git add lib/buildZip.ts __tests__/lib/buildZip.test.ts
git commit -m "feat: add buildZip utility with filename deduplication"
```

---

## Task 6: Build UploadZone Component

**Files:**
- Create: `components/UploadZone.tsx`

- [ ] **Step 1: Create UploadZone**

```typescript
// components/UploadZone.tsx
'use client'

import { useRef, useState } from 'react'

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const MAX_SIZE_MB = 20
const MAX_FILES = 20

interface Props {
  onFilesAccepted: (files: File[]) => void
  currentCount: number
}

export default function UploadZone({ onFilesAccepted, currentCount }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function validate(files: File[]): { valid: File[]; error: string | null } {
    const valid: File[] = []
    const remaining = MAX_FILES - currentCount

    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        return { valid, error: '仅支持 PNG / JPG / WEBP 格式' }
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        return { valid, error: `文件大小不能超过 ${MAX_SIZE_MB}MB` }
      }
      valid.push(file)
    }

    if (valid.length > remaining) {
      return {
        valid: valid.slice(0, remaining),
        error: `最多支持 ${MAX_FILES} 张图片，已截取前 ${remaining} 张`,
      }
    }

    return { valid, error: null }
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const { valid, error } = validate(Array.from(files))
    setError(error)
    if (valid.length > 0) onFilesAccepted(valid)
  }

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          dragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400 bg-gray-50'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
      >
        <p className="text-gray-500 text-sm">
          拖拽图片到此处，或<span className="text-blue-500 font-medium"> 点击上传</span>
        </p>
        <p className="text-gray-400 text-xs mt-1">支持 PNG / JPG / WEBP，单张最大 20MB，最多 20 张</p>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/UploadZone.tsx
git commit -m "feat: add UploadZone component with drag-and-drop and validation"
```

---

## Task 7: Build ImageList Component

**Files:**
- Create: `components/ImageList.tsx`

- [ ] **Step 1: Create ImageList**

```typescript
// components/ImageList.tsx
'use client'

import { UploadedImage } from '@/lib/types'

interface Props {
  images: UploadedImage[]
  onRemove: (id: string) => void
}

export default function ImageList({ images, onRemove }: Props) {
  if (images.length === 0) return null

  return (
    <div className="w-full">
      <p className="text-sm text-gray-500 mb-2">{images.length} 张图片已上传</p>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {images.map((img) => (
          <div key={img.id} className="relative group rounded-lg overflow-hidden border border-gray-200 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.previewUrl}
              alt={img.file.name}
              className="w-full aspect-[9/16] object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            <button
              onClick={() => onRemove(img.id)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              title="删除"
            >
              ×
            </button>
            {img.error && (
              <div className="absolute bottom-0 left-0 right-0 bg-red-500/80 text-white text-xs p-1 text-center">
                处理失败
              </div>
            )}
            <div className="px-1 py-1">
              <p className="text-xs text-gray-500 truncate">{img.file.name}</p>
              <p className="text-xs text-gray-400">{(img.file.size / 1024).toFixed(0)} KB</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/ImageList.tsx
git commit -m "feat: add ImageList component with thumbnail grid and remove button"
```

---

## Task 8: Build ResolutionSelector Component

**Files:**
- Create: `components/ResolutionSelector.tsx`

- [ ] **Step 1: Create ResolutionSelector**

```typescript
// components/ResolutionSelector.tsx
'use client'

import { Resolution, RESOLUTIONS } from '@/lib/types'

interface Props {
  selected: Resolution
  onChange: (resolution: Resolution) => void
}

export default function ResolutionSelector({ selected, onChange }: Props) {
  return (
    <div className="w-full">
      <p className="text-sm font-medium text-gray-700 mb-2">目标分辨率</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {RESOLUTIONS.map((res) => (
          <label
            key={`${res.width}x${res.height}`}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              selected.width === res.width && selected.height === res.height
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300 bg-white'
            }`}
          >
            <input
              type="radio"
              name="resolution"
              className="accent-blue-500"
              checked={selected.width === res.width && selected.height === res.height}
              onChange={() => onChange(res)}
            />
            <span className="text-sm text-gray-700">{res.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/ResolutionSelector.tsx
git commit -m "feat: add ResolutionSelector component with radio buttons"
```

---

## Task 9: Assemble Main Page

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Update layout.tsx**

```typescript
// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'App Store 截图尺寸调整',
  description: '批量将截图调整为苹果应用商店所需的分辨率',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-100 antialiased">{children}</body>
    </html>
  )
}
```

- [ ] **Step 2: Build page.tsx**

```typescript
// app/page.tsx
'use client'

import { useState } from 'react'
import UploadZone from '@/components/UploadZone'
import ImageList from '@/components/ImageList'
import ResolutionSelector from '@/components/ResolutionSelector'
import { UploadedImage, Resolution, RESOLUTIONS } from '@/lib/types'
import { resizeImage } from '@/lib/resizeImage'
import { buildOutputFilename, buildZipFilename, downloadAsZip } from '@/lib/buildZip'

export default function Home() {
  const [images, setImages] = useState<UploadedImage[]>([])
  const [resolution, setResolution] = useState<Resolution>(RESOLUTIONS[0])
  const [processing, setProcessing] = useState(false)

  function handleFilesAccepted(files: File[]) {
    const newImages: UploadedImage[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }))
    setImages((prev) => [...prev, ...newImages])
  }

  function handleRemove(id: string) {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id)
      if (img) URL.revokeObjectURL(img.previewUrl)
      return prev.filter((i) => i.id !== id)
    })
  }

  async function handleProcess() {
    if (images.length === 0 || processing) return
    setProcessing(true)

    const seen = new Map<string, number>()
    const results: { blob: Blob; filename: string }[] = []
    const errors: string[] = []

    for (const img of images) {
      try {
        const blob = await resizeImage(img.file, resolution.width, resolution.height)
        const filename = buildOutputFilename(img.file.name, resolution.width, resolution.height, seen)
        results.push({ blob, filename })
      } catch {
        errors.push(img.file.name)
      }
    }

    if (errors.length > 0) {
      setImages((prev) =>
        prev.map((img) =>
          errors.includes(img.file.name) ? { ...img, error: '处理失败' } : img
        )
      )
    }

    if (results.length > 0) {
      await downloadAsZip(results, buildZipFilename(resolution.width, resolution.height))
    }

    setProcessing(false)
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">App Store 截图尺寸调整</h1>
        <p className="text-sm text-gray-500 mt-1">
          上传截图，选择目标分辨率，一键调整并打包下载
        </p>
      </div>

      <UploadZone onFilesAccepted={handleFilesAccepted} currentCount={images.length} />

      <ImageList images={images} onRemove={handleRemove} />

      <ResolutionSelector selected={resolution} onChange={setResolution} />

      <button
        onClick={handleProcess}
        disabled={images.length === 0 || processing}
        className="w-full py-3 rounded-xl text-white font-medium transition-colors
          bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {processing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            处理中…
          </span>
        ) : `调整尺寸并下载 ZIP (${images.length} 张)`}
      </button>
    </main>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx app/page.tsx
git commit -m "feat: assemble main page with full processing flow"
```

---

## Task 10: Run All Tests and Manual Verification

- [ ] **Step 1: Run full test suite**

```bash
npx jest --no-coverage
```
Expected: All tests pass. If any fail, fix before proceeding.

- [ ] **Step 2: Start dev server**

```bash
npm run dev
```
Open http://localhost:3000

- [ ] **Step 3: Manual test — basic flow**

1. Upload 1 PNG, 1 JPG, and 1 WEBP file
2. Verify thumbnails appear with filename and file size
3. Verify first resolution (1242×2688) is pre-selected
4. Click "调整尺寸并下载 ZIP"
5. Verify ZIP downloads containing 3 files
6. Open each file and verify pixel dimensions match 1242×2688

- [ ] **Step 4: Manual test — validation**

1. Try uploading a .txt file → verify error message "仅支持 PNG / JPG / WEBP 格式"
2. Remove an image by hovering and clicking ×
3. Verify button is disabled when no images are present

- [ ] **Step 5: Manual test — filename deduplication**

1. Upload two copies of the same file
2. Download ZIP
3. Verify ZIP contains both files with distinct names (e.g. `screen_1242x2688.png` and `screen_1242x2688_2.png`)

- [ ] **Step 6: Test all 4 resolutions**

Select each resolution, upload a screenshot, verify the downloaded file has the correct dimensions.

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "chore: verified all tests pass and manual QA complete"
```

---

## Task 11: Production Build Verification

- [ ] **Step 1: Run production build**

```bash
npm run build
```
Expected: Build succeeds with no errors.

- [ ] **Step 2: Commit if any build fixes were needed**

```bash
git add -A
git commit -m "fix: resolve any production build issues"
```

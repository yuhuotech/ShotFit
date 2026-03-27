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

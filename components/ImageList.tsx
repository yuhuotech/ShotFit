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

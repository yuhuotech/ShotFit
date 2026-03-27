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

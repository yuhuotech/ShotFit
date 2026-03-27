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

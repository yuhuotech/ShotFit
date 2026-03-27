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

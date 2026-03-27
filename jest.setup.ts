import 'jest-canvas-mock'
import '@testing-library/jest-dom'

// jsdom does not implement URL.createObjectURL / revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = jest.fn()

// jsdom's HTMLImageElement does not fire onload for blob: URLs.
// Patch the HTMLImageElement prototype's src setter so that any blob: URL
// assignment immediately schedules an onload call, making it instanceof-safe.
const imgProto = Object.getPrototypeOf(document.createElement('img'))
const originalSrcDescriptor = Object.getOwnPropertyDescriptor(imgProto, 'src') ||
  Object.getOwnPropertyDescriptor(Object.getPrototypeOf(imgProto), 'src')
if (originalSrcDescriptor && originalSrcDescriptor.set) {
  Object.defineProperty(imgProto, 'src', {
    ...originalSrcDescriptor,
    set(value: string) {
      originalSrcDescriptor.set!.call(this, value)
      // jsdom won't fire onload for blob: URLs — do it manually
      Promise.resolve().then(() => {
        if (typeof this.onload === 'function') {
          this.onload(new Event('load'))
        }
      })
    },
  })
}

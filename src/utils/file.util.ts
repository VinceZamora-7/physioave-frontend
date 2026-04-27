/**
 * Convert a File object to base64-encoded string
 * @param file - The file to convert
 * @returns Promise that resolves to base64-encoded string
 */
export const fileToBase64 = async (file: File): Promise<string> => {
  const bytes = await file.arrayBuffer()
  let binary = ''
  const chunkSize = 0x8000
  const view = new Uint8Array(bytes)

  for (let index = 0; index < view.length; index += chunkSize) {
    const chunk = view.subarray(index, index + chunkSize)
    binary += String.fromCharCode(...chunk)
  }

  return btoa(binary)
}

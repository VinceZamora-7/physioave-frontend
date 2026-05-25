import type {AxiosResponse} from "axios"

export const exportToExcel = (response: AxiosResponse<Blob>, fallbackFilename = 'export.csv'): void => {
  const disposition: string | undefined = response.headers['content-disposition']
  const filename = disposition?.match(/filename="?([^"]+)"?/i)?.[1] ?? fallbackFilename

  const blob: Blob = response.data
  const url: string = URL.createObjectURL(blob)

  const link: HTMLAnchorElement = document.createElement('a')
  link.href = url
  link.download = filename

  document.body.appendChild(link)
  link.click()
  link.remove()

  URL.revokeObjectURL(url)
}

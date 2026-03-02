import type {AxiosResponse} from "axios"

export const exportToExcel = (response: AxiosResponse<Blob>): void => {
  const disposition = response.headers['content-disposition']!

  const blob: Blob = response.data
  const url: string = URL.createObjectURL(blob)

  const link: HTMLAnchorElement = document.createElement('a')
  link.href = url
  link.download = disposition.match(/filename="?([^"]+)"?/i)![1]

  document.body.appendChild(link)
  link.click()
  link.remove()

  URL.revokeObjectURL(url)
}

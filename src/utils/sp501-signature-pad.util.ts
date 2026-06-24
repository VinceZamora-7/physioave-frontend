type Sp501FunctionName =
  | "ZCStartDeviceAB"
  | "ZCStopDeviceAB"
  | "ZCBeginSignAB"
  | "ZCEndSignAB"
  | "ZCOutputImageBase64AB"
  | "ZCRealTimeOutputImageBase64AB"
  | "ZCShowHtmlAB"
  | "ZCSetModeAB"
  | "ZCCloseHtmlAB"

type Sp501Message = {
  Base64?: string
  errorMsg?: string
  functionName?: Sp501FunctionName
  success?: number | string
}

type Sp501SignBounds = {
  x: number
  y: number
  width: number
  height: number
}

type PendingResponse = {
  reject: (error: Error) => void
  resolve: (message: Sp501Message) => void
  timer: ReturnType<typeof window.setTimeout>
}

type ShowIdlePageOptions = {
  force?: boolean
}

export type Sp501SignatureSessionCallbacks = {
  onError?: (error: Error) => void
  onLiveSignature?: (dataUrl: string) => void
  onSignatureComplete?: (dataUrl: string) => void | Promise<void>
}

const DEFAULT_SOCKET_URL = "ws://127.0.0.1:12343"
const DEFAULT_SIGN_BOUNDS: Sp501SignBounds = {
  x: 0,
  y: 0,
  width: 800,
  height: 480,
}

const SIGN_BOUNDS_STORAGE_KEY = "sp501-sign-bounds-v2"
const CAPTURED_IDLE_HOLD_MS = 5000

const configuredIdlePageUrl = (): string => {
  const configuredUrl = String(import.meta.env.VITE_SP501_IDLE_PAGE_URL ?? "").trim()
  if (configuredUrl) return configuredUrl
  return `${window.location.origin}/sp501-loading.html`
}

const configuredCapturedPageUrl = (): string => {
  const configuredUrl = String(import.meta.env.VITE_SP501_CAPTURED_PAGE_URL ?? "").trim()
  if (configuredUrl) return configuredUrl
  return `${configuredIdlePageUrl()}?state=captured`
}

const isSuccess = (message: Sp501Message): boolean =>
  message.success === 1 ||
  message.success === "1" ||
  (
    (message.functionName === "ZCOutputImageBase64AB" ||
      message.functionName === "ZCRealTimeOutputImageBase64AB") &&
    Boolean(String(message.Base64 ?? "").trim())
  )

const toDataUrl = (base64: string): string =>
  `data:image/png;base64,${base64}`

const parseSignBounds = (value: string | null): Sp501SignBounds | null => {
  if (!value) return null

  try {
    const parsed = JSON.parse(value) as Partial<Sp501SignBounds>
    const x = Number(parsed.x)
    const y = Number(parsed.y)
    const width = Number(parsed.width)
    const height = Number(parsed.height)
    if (![x, y, width, height].every(Number.isFinite)) return null
    if (width <= 0 || height <= 0) return null
    return { x, y, width, height }
  } catch {
    return null
  }
}

const envNumber = (key: string): number | null => {
  const value = Number(import.meta.env[key])
  return Number.isFinite(value) ? value : null
}

const configuredSignBounds = (): Sp501SignBounds => {
  const stored = parseSignBounds(window.localStorage.getItem(SIGN_BOUNDS_STORAGE_KEY))
  if (stored) return stored

  return {
    x: envNumber("VITE_SP501_SIGN_X") ?? DEFAULT_SIGN_BOUNDS.x,
    y: envNumber("VITE_SP501_SIGN_Y") ?? DEFAULT_SIGN_BOUNDS.y,
    width: envNumber("VITE_SP501_SIGN_WIDTH") ?? DEFAULT_SIGN_BOUNDS.width,
    height: envNumber("VITE_SP501_SIGN_HEIGHT") ?? DEFAULT_SIGN_BOUNDS.height,
  }
}

class Sp501SignaturePad {
  private capturedIdleHoldUntil = 0
  private isCompletingSignature = false
  private isSignatureActive = false
  private latestLiveBase64 = ""
  private pending = new Map<Sp501FunctionName, PendingResponse[]>()
  private sessionCallbacks: Sp501SignatureSessionCallbacks = {}
  private socket: WebSocket | null = null
  private socketUrl = DEFAULT_SOCKET_URL

  async beginSignature(
    bounds = configuredSignBounds(),
    callbacks: Sp501SignatureSessionCallbacks = {}
  ): Promise<void> {
    this.latestLiveBase64 = ""
    this.sessionCallbacks = callbacks
    this.isSignatureActive = true

    try {
      await this.sendAndWait({ function: "ZCEndSignAB" }, "ZCEndSignAB", 800).catch(() => {})
      await this.sendAndWait({ function: "ZCCloseHtmlAB" }, "ZCCloseHtmlAB", 800).catch(() => {})
      await this.sendAndWait({ function: "ZCStartDeviceAB" }, "ZCStartDeviceAB")
      await this.sendAndWait({ function: "ZCSetModeAB", mode: 2 }, "ZCSetModeAB")
      await this.sendAndWait(
        {
          function: "ZCBeginSignAB",
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
        },
        "ZCBeginSignAB"
      )
    } catch (error) {
      this.isSignatureActive = false
      throw error
    }
  }

  async captureSignature(): Promise<string> {
    await this.sendAndWait({ function: "ZCEndSignAB" }, "ZCEndSignAB", 1500)
    this.isSignatureActive = false

    try {
      const response = await this.sendAndWait(
        { function: "ZCOutputImageBase64AB" },
        "ZCOutputImageBase64AB",
        2000
      )
      if (response.Base64) {
        await this.showCapturedPage()
        this.clearSignatureSession()
        return toDataUrl(response.Base64)
      }
    } catch {
      if (this.latestLiveBase64) {
        const dataUrl = toDataUrl(this.latestLiveBase64)
        await this.showCapturedPage()
        this.clearSignatureSession()
        return dataUrl
      }
      this.clearSignatureSession()
      throw new Error("SP501 did not return a signature image")
    }

    if (this.latestLiveBase64) {
      const dataUrl = toDataUrl(this.latestLiveBase64)
      await this.showCapturedPage()
      this.clearSignatureSession()
      return dataUrl
    }
    this.clearSignatureSession()
    throw new Error("SP501 did not return a signature image")
  }

  clearSignatureSession(): void {
    this.isCompletingSignature = false
    this.isSignatureActive = false
    this.latestLiveBase64 = ""
    this.sessionCallbacks = {}
  }

  async showIdlePage(url = configuredIdlePageUrl(), options: ShowIdlePageOptions = {}): Promise<void> {
    if (this.isSignatureActive && !options.force) return
    if (!options.force && Date.now() < this.capturedIdleHoldUntil) return
    await this.sendAndWait({ function: "ZCShowHtmlAB", url }, "ZCShowHtmlAB", 1500).catch(() => {})
  }

  async showCapturedPage(): Promise<void> {
    this.capturedIdleHoldUntil = Date.now() + CAPTURED_IDLE_HOLD_MS
    await this.showIdlePage(configuredCapturedPageUrl(), { force: true })
  }

  async returnToIdlePage(): Promise<void> {
    this.clearSignatureSession()
    await this.sendAndWait({ function: "ZCEndSignAB" }, "ZCEndSignAB", 1000).catch(() => {})
    await this.showIdlePage(undefined, { force: true })
  }

  startIdlePageKeepalive(intervalMs = 5000): () => void {
    void this.showIdlePage()
    const intervalId = window.setInterval(() => {
      void this.showIdlePage()
    }, intervalMs)

    return () => window.clearInterval(intervalId)
  }

  async stopDevice(): Promise<void> {
    this.clearSignatureSession()
    await this.sendAndWait({ function: "ZCEndSignAB" }, "ZCEndSignAB", 1000).catch(() => {})
    await this.sendAndWait({ function: "ZCStopDeviceAB" }, "ZCStopDeviceAB", 1000).catch(() => {})
  }

  private async completeSignatureFromBase64(base64: string): Promise<void> {
    if (this.isCompletingSignature) return

    this.isCompletingSignature = true
    this.isSignatureActive = false

    try {
      const dataUrl = toDataUrl(base64)
      await this.showCapturedPage()
      await this.sessionCallbacks.onSignatureComplete?.(dataUrl)
    } catch (error) {
      this.sessionCallbacks.onError?.(error as Error)
    } finally {
      this.clearSignatureSession()
    }
  }

  private async completeSignatureFromPadSave(): Promise<void> {
    if (this.isCompletingSignature) return

    this.isCompletingSignature = true
    this.isSignatureActive = false

    try {
      const response = await this.sendAndWait(
        { function: "ZCOutputImageBase64AB" },
        "ZCOutputImageBase64AB",
        2500
      )
      const base64 = response.Base64 || this.latestLiveBase64
      if (!base64) throw new Error("SP501 did not return a signature image")

      const dataUrl = toDataUrl(base64)
      await this.showCapturedPage()
      await this.sessionCallbacks.onSignatureComplete?.(dataUrl)
    } catch (error) {
      this.sessionCallbacks.onError?.(error as Error)
    } finally {
      this.clearSignatureSession()
    }
  }

  private connect(): Promise<WebSocket> {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return Promise.resolve(this.socket)
    }

    return new Promise((resolve, reject) => {
      const socket = new WebSocket(this.socketUrl)
      this.socket = socket

      socket.onopen = () => resolve(socket)
      socket.onmessage = (event) => this.handleMessage(event)
      socket.onclose = () => {
        this.socket = null
        this.rejectAll(new Error("SP501 connection closed"))
      }
      socket.onerror = () => {
        this.socket = null
        const error = new Error("Unable to connect to SP501. Make sure SignBrowserApp.exe is running.")
        this.rejectAll(error)
        reject(error)
      }
    })
  }

  private handleMessage(event: MessageEvent<string>): void {
    let message: Sp501Message
    try {
      message = JSON.parse(event.data) as Sp501Message
    } catch {
      return
    }

    if (message.functionName === "ZCRealTimeOutputImageBase64AB" && message.Base64) {
      this.latestLiveBase64 = message.Base64
      this.sessionCallbacks.onLiveSignature?.(toDataUrl(message.Base64))
      return
    }

    if (!message.functionName) return
    const queue = this.pending.get(message.functionName)
    const waiter = queue?.shift()
    if (!waiter) {
      if (message.functionName === "ZCOutputImageBase64AB" && message.Base64) {
        void this.completeSignatureFromBase64(message.Base64)
      } else if (message.functionName === "ZCEndSignAB" && this.isSignatureActive) {
        void this.completeSignatureFromPadSave()
      }
      return
    }
    if (!queue?.length) this.pending.delete(message.functionName)

    window.clearTimeout(waiter.timer)
    if (isSuccess(message)) {
      waiter.resolve(message)
      return
    }

    waiter.reject(new Error(message.errorMsg || `${message.functionName} failed`))
  }

  private rejectAll(error: Error): void {
    this.pending.forEach((queue) => {
      queue.forEach((waiter) => {
        window.clearTimeout(waiter.timer)
        waiter.reject(error)
      })
    })
    this.pending.clear()
  }

  private async sendAndWait(
    command: Record<string, unknown> & { function: Sp501FunctionName },
    expectedFunction: Sp501FunctionName,
    timeoutMs = 3000
  ): Promise<Sp501Message> {
    const socket = await this.connect()

    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        const queue = this.pending.get(expectedFunction) ?? []
        this.pending.set(
          expectedFunction,
          queue.filter((waiter) => waiter.resolve !== resolve)
        )
        reject(new Error(`${expectedFunction} timed out`))
      }, timeoutMs)

      const queue = this.pending.get(expectedFunction) ?? []
      queue.push({ reject, resolve, timer })
      this.pending.set(expectedFunction, queue)
      socket.send(JSON.stringify(command))
    })
  }
}

export const sp501SignaturePad = new Sp501SignaturePad()

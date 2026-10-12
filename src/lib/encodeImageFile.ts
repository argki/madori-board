import { readFileAsDataUrl } from './readFileAsDataUrl'

export type EncodedBackgroundImage = {
  name: string
  dataUrl: string
  mimeType: 'image/webp' | 'image/jpeg'
  width: number
  height: number
}

export type EncodeImageOptions = {
  /** 長辺の上限（px）。超える場合は等比で縮小する */
  maxEdge?: number
  /** 0〜1。WebP / JPEG の品質 */
  quality?: number
}

const DEFAULT_MAX_EDGE = 2400
const DEFAULT_QUALITY = 0.82

function replaceExtension(filename: string, ext: string): string {
  const base = filename.replace(/\.[^.]+$/, '')
  return `${base || 'background'}.${ext}`
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new window.Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('画像として読み込めませんでした'))
    }
    image.src = url
  })
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality)
  })
}

function supportsCanvasMimeType(
  canvas: HTMLCanvasElement,
  mimeType: string,
): boolean {
  const sample = canvas.toDataURL(mimeType)
  return sample.startsWith(`data:${mimeType}`)
}

/**
 * 背景画像をリサイズし、WebP（非対応時は JPEG）へ再エンコードして Data URL にする。
 * JSON 埋め込み時のファイル肥大を抑える。
 */
export async function encodeImageFileAsDataUrl(
  file: File,
  options: EncodeImageOptions = {},
): Promise<EncodedBackgroundImage> {
  const maxEdge = options.maxEdge ?? DEFAULT_MAX_EDGE
  const quality = options.quality ?? DEFAULT_QUALITY

  const image = await loadImageFromFile(file)
  const sourceWidth = image.naturalWidth || image.width
  const sourceHeight = image.naturalHeight || image.height
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    throw new Error('画像サイズを取得できませんでした')
  }

  const scale = Math.min(1, maxEdge / Math.max(sourceWidth, sourceHeight))
  const width = Math.max(1, Math.round(sourceWidth * scale))
  const height = Math.max(1, Math.round(sourceHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvas を初期化できませんでした')
  }
  context.drawImage(image, 0, 0, width, height)

  const preferWebp = supportsCanvasMimeType(canvas, 'image/webp')
  const mimeType: 'image/webp' | 'image/jpeg' = preferWebp
    ? 'image/webp'
    : 'image/jpeg'
  const ext = preferWebp ? 'webp' : 'jpg'

  let blob = await canvasToBlob(canvas, mimeType, quality)
  if (!blob && mimeType === 'image/webp') {
    blob = await canvasToBlob(canvas, 'image/jpeg', quality)
    if (!blob) {
      throw new Error('画像の再エンコードに失敗しました')
    }
    const dataUrl = await readFileAsDataUrl(
      new File([blob], replaceExtension(file.name, 'jpg'), {
        type: 'image/jpeg',
      }),
    )
    return {
      name: replaceExtension(file.name, 'jpg'),
      dataUrl,
      mimeType: 'image/jpeg',
      width,
      height,
    }
  }
  if (!blob) {
    throw new Error('画像の再エンコードに失敗しました')
  }

  const name = replaceExtension(file.name, ext)
  const dataUrl = await readFileAsDataUrl(
    new File([blob], name, { type: mimeType }),
  )
  return { name, dataUrl, mimeType, width, height }
}

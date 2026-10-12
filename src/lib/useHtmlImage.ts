import { useEffect, useState } from 'react'

/** dataUrl / URL から HTMLImageElement を読み込む */
export function useHtmlImage(src?: string): HTMLImageElement | undefined {
  const [image, setImage] = useState<HTMLImageElement | undefined>()

  useEffect(() => {
    if (!src) {
      setImage(undefined)
      return
    }
    let cancelled = false
    const img = new window.Image()
    img.onload = () => {
      if (!cancelled) setImage(img)
    }
    img.onerror = () => {
      if (!cancelled) setImage(undefined)
    }
    img.src = src
    return () => {
      cancelled = true
    }
  }, [src])

  return image
}

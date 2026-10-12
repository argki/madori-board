import { useEffect } from 'react'

/**
 * iOS Safari は入力フォーカスで visualViewport をスクロールし、
 * position:fixed のナビ／図面が画面外へ出たまま残ることがある。
 * :root に visualViewport の矩形を載せ、殻と立面モーダルをそこに合わせる。
 */
export function useVisualViewportLock(): void {
  useEffect(() => {
    const root = document.documentElement

    const resetDocumentScroll = () => {
      if (window.scrollX !== 0 || window.scrollY !== 0) {
        window.scrollTo(0, 0)
      }
      if (document.body.scrollTop !== 0) document.body.scrollTop = 0
      if (root.scrollTop !== 0) root.scrollTop = 0
    }

    const sync = () => {
      resetDocumentScroll()
      const vv = window.visualViewport
      if (!vv) {
        root.style.setProperty('--vv-top', '0px')
        root.style.setProperty('--vv-left', '0px')
        root.style.setProperty('--vv-width', '100%')
        root.style.setProperty('--vv-height', '100dvh')
        return
      }
      root.style.setProperty('--vv-top', `${Math.round(vv.offsetTop)}px`)
      root.style.setProperty('--vv-left', `${Math.round(vv.offsetLeft)}px`)
      root.style.setProperty('--vv-width', `${Math.round(vv.width)}px`)
      root.style.setProperty('--vv-height', `${Math.round(vv.height)}px`)
    }

    const resyncSoon = () => {
      sync()
      requestAnimationFrame(sync)
      window.setTimeout(sync, 50)
      window.setTimeout(sync, 300)
    }

    const onFocusIn = (event: FocusEvent) => {
      const target = event.target
      if (!(target instanceof HTMLElement)) return
      if (
        target.tagName !== 'INPUT' &&
        target.tagName !== 'TEXTAREA' &&
        !target.isContentEditable
      ) {
        return
      }
      resyncSoon()
    }

    const onFocusOut = () => {
      resyncSoon()
    }

    sync()
    const vv = window.visualViewport
    vv?.addEventListener('resize', sync)
    vv?.addEventListener('scroll', sync)
    window.addEventListener('resize', sync)
    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', onFocusOut)

    return () => {
      vv?.removeEventListener('resize', sync)
      vv?.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', onFocusOut)
      root.style.removeProperty('--vv-top')
      root.style.removeProperty('--vv-left')
      root.style.removeProperty('--vv-width')
      root.style.removeProperty('--vv-height')
    }
  }, [])
}

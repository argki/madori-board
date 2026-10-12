import { useEffect } from 'react'

/**
 * ソフトキーボード分を `--keyboard-inset` に載せ、レイアウトの scroll を 0 に保つ。
 * ナビや図面は動かさず、寸法パネル側が `bottom` でキーボード上に乗る想定。
 */
export function useKeyboardInset(): void {
  useEffect(() => {
    const root = document.documentElement

    const sync = () => {
      if (window.scrollX !== 0 || window.scrollY !== 0) {
        window.scrollTo(0, 0)
      }
      const vv = window.visualViewport
      if (!vv) {
        root.style.setProperty('--keyboard-inset', '0px')
        return
      }
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      root.style.setProperty('--keyboard-inset', `${Math.round(inset)}px`)
    }

    const resyncAfterFocus = () => {
      // iOS が入力へスクロールしたあとに戻す（タイミングが機種でずれる）
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
      resyncAfterFocus()
    }

    sync()
    const vv = window.visualViewport
    vv?.addEventListener('resize', sync)
    vv?.addEventListener('scroll', sync)
    window.addEventListener('resize', sync)
    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', resyncAfterFocus)

    return () => {
      vv?.removeEventListener('resize', sync)
      vv?.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', resyncAfterFocus)
      root.style.removeProperty('--keyboard-inset')
    }
  }, [])
}

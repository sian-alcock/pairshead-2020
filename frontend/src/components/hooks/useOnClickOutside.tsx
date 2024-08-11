import React, { useEffect } from 'react'

export default function useOnClickOutside(ref: React.RefObject<HTMLElement>, handler: () => void): void {
  useEffect(() => {
    const listener = (event: TouchEvent | MouseEvent): void => {
      if (!ref.current || (event.target instanceof HTMLElement && ref.current.contains(event.target))) {
        return
      }
      handler()
    }

    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)

    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [ref, handler])
}

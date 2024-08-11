// Based on https://hiddedevries.nl/en/blog/2017-01-29-using-javascript-to-trap-focus-in-an-element

import React, { useRef, useEffect, ReactNode, ReactElement } from 'react'

const getFocusableElements = (parentElement: HTMLElement): HTMLElement[] => {
  const focusableElements =
    'button:not([disabled]), iframe, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]'
  const elements = parentElement.querySelectorAll<HTMLElement>(focusableElements)
  const focusable: HTMLElement[] = [];

  [].forEach.call(elements, function (el) {
    focusable.push(el)
  })

  //   return focusable.filter((el: HTMLElement) => !(el as HTMLInputElement).disabled);
  return focusable
}

function useFocusTrap(): React.MutableRefObject<HTMLDivElement | null> {
  const elRef = useRef<HTMLDivElement | null>(null)

  function handleFocus(e: KeyboardEvent): void {
    const focusableEls = elRef && elRef.current ? getFocusableElements(elRef.current) : []
    const firstFocusableEl = focusableEls[0]
    const lastFocusableEl = focusableEls[focusableEls.length - 1]
    const isTabPressed = e.key === 'Tab'

    if (!isTabPressed) {
      return
    }

    if (e.shiftKey) {
      /* shift + tab */ if (document.activeElement === firstFocusableEl) {
        lastFocusableEl.focus()
        e.preventDefault()
      }
    } /* tab */ else {
      if (document.activeElement === lastFocusableEl) {
        firstFocusableEl.focus()
        e.preventDefault()
      }
    }
  }

  useEffect(() => {
    const element = elRef.current

    if (element) {
      element.addEventListener('keydown', handleFocus)
    }

    return () => {
      element?.removeEventListener('keydown', handleFocus)
    }
  }, [])

  return elRef
}

export interface FocusTrapProps {
  children: ReactNode;
}

export default function FocusTrap(props: FocusTrapProps): ReactElement {
  const elRef = useFocusTrap()

  return (
    <div className={'trap'} ref={elRef}>
      {props.children}
    </div>
  )
}

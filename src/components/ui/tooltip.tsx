'use client'

import { useState } from 'react'

export function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false)
  return (
    <span className="relative inline-block ml-1">
      <button
        type="button"
        className="w-4 h-4 rounded-full bg-muted text-muted-foreground text-[10px] font-bold inline-flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
      >
        ?
      </button>
      {show && (
        <span className="absolute left-6 top-0 z-50 w-64 p-2 bg-popover text-popover-foreground text-xs rounded border shadow-lg normal-case font-normal">
          {text}
        </span>
      )}
    </span>
  )
}

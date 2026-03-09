'use client'

import { useState } from 'react'
import { Link2, Check } from 'lucide-react'

export function ShareButton() {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-background font-mono text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Link2 className="w-3.5 h-3.5" />}
      {copied ? 'Copied!' : 'Share'}
    </button>
  )
}

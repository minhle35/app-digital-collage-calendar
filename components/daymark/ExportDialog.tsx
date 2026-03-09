'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDayMark } from '@/lib/DayMarkContext'
import { generateMemoryId } from '@/lib/types'
import html2canvas from 'html2canvas'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Spinner } from '@/components/ui/spinner'
import { Download, Copy, Check, Share2, Sparkles } from 'lucide-react'

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const { state, dispatch } = useDayMark()
  const [scale, setScale] = useState(2)
  const [isExporting, setIsExporting] = useState(false)
  const [exportedUrl, setExportedUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setExportedUrl(null)
      setCopied(false)
    }
  }, [open])

  const handleExport = useCallback(async () => {
    const canvas = document.getElementById('daymark-canvas')
    if (!canvas) return

    setIsExporting(true)
    dispatch({ type: 'START_EXPORT' })

    try {
      // Temporarily hide selection state
      dispatch({ type: 'SELECT_ELEMENT', id: null })

      // Wait for UI to update
      await new Promise((r) => setTimeout(r, 100))

      const result = await html2canvas(canvas, {
        scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
      })

      const dataUrl = result.toDataURL('image/png')
      setExportedUrl(dataUrl)

      const memoryId = generateMemoryId(state.selectedDate || new Date())
      dispatch({ type: 'FINISH_EXPORT', imageUrl: dataUrl, memoryId })
      dispatch({ type: 'SHOW_CELEBRATION', show: true })

      // Hide celebration after 3 seconds
      setTimeout(() => {
        dispatch({ type: 'SHOW_CELEBRATION', show: false })
      }, 3000)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }, [scale, state.selectedDate, dispatch])

  const handleDownload = useCallback(() => {
    if (!exportedUrl) return

    const link = document.createElement('a')
    link.download = `daymark-${state.memoryId || 'memory'}.png`
    link.href = exportedUrl
    link.click()
  }, [exportedUrl, state.memoryId])

  const handleCopyLink = useCallback(async () => {
    const shareUrl = `${window.location.origin}/memory/${state.memoryId || 'new'}`
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [state.memoryId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            Export Memory
          </DialogTitle>
          <DialogDescription className="font-mono text-xs">
            Download your creation as a high-resolution image
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Scale selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="font-mono text-xs">Export Scale</Label>
              <span className="font-mono text-xs text-muted-foreground">
                {scale}x ({800 * scale} x {600 * scale}px)
              </span>
            </div>
            <Slider
              value={[scale]}
              onValueChange={(v) => setScale(v[0])}
              min={1}
              max={4}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between font-mono text-xs text-muted-foreground">
              <span>1x (fast)</span>
              <span>4x (high-res)</span>
            </div>
          </div>

          {/* Export button or preview */}
          {!exportedUrl ? (
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full gap-2 font-mono"
            >
              {isExporting ? (
                <>
                  <Spinner className="w-4 h-4" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Generate Image
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-4">
              {/* Preview */}
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img
                  src={exportedUrl}
                  alt="Exported memory"
                  className="w-full h-auto"
                />
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleDownload}
                  className="gap-2 font-mono text-xs"
                >
                  <Download className="w-4 h-4" />
                  Download PNG
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCopyLink}
                  className="gap-2 font-mono text-xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Link
                    </>
                  )}
                </Button>
              </div>

              {/* Share URL preview */}
              <div className="space-y-1">
                <Label className="font-mono text-xs">Share URL (coming soon)</Label>
                <Input
                  readOnly
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/memory/${state.memoryId || 'new'}`}
                  className="font-mono text-xs bg-muted"
                />
              </div>

              {/* Regenerate option */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExportedUrl(null)}
                className="w-full font-mono text-xs text-muted-foreground"
              >
                Export with different settings
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

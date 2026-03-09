'use client'

import { useState, useCallback } from 'react'
import { useDayMark } from '@/lib/DayMarkContext'
import { fetchDateContext } from '@/lib/types'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Spinner } from '@/components/ui/spinner'
import { CalendarDays, Moon, Cloud, Newspaper, Sparkles } from 'lucide-react'

interface DatePickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DatePickerDialog({ open, onOpenChange }: DatePickerDialogProps) {
  const { state, dispatch } = useDayMark()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    state.selectedDate || undefined
  )
  const [isLoading, setIsLoading] = useState(false)
  const [contextPreview, setContextPreview] = useState(state.dateContext)

  const handleDateSelect = useCallback(async (date: Date | undefined) => {
    if (!date) return
    setSelectedDate(date)
    setIsLoading(true)

    try {
      const context = await fetchDateContext(date)
      setContextPreview(context)
    } catch (error) {
      console.error('Failed to fetch context:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleConfirm = useCallback(() => {
    if (selectedDate && contextPreview) {
      dispatch({ type: 'SET_DATE', date: selectedDate })
      dispatch({ type: 'SET_DATE_CONTEXT', context: contextPreview })
      onOpenChange(false)
    }
  }, [selectedDate, contextPreview, dispatch, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-accent" />
            Pick Your Date
          </DialogTitle>
          <DialogDescription className="font-mono text-xs">
            Choose a meaningful date for your memory
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              className="rounded-md border"
            />
          </div>

          {/* Context Preview */}
          {selectedDate && (
            <div className="space-y-3">
              <div className="text-center">
                <p className="font-serif text-lg font-semibold">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </p>
                {contextPreview && (
                  <p className="font-mono text-xs text-muted-foreground">
                    {contextPreview.daysRelative}
                  </p>
                )}
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Spinner className="w-5 h-5 mr-2" />
                  <span className="font-mono text-sm text-muted-foreground">
                    Fetching context...
                  </span>
                </div>
              ) : contextPreview ? (
                <div className="grid grid-cols-2 gap-2 p-3 bg-secondary/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4 text-muted-foreground" />
                    <span className="font-mono text-xs">{contextPreview.moonPhase}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-muted-foreground" />
                    <span className="font-mono text-xs">{contextPreview.weather}</span>
                  </div>
                  <div className="col-span-2 flex items-start gap-2">
                    <Newspaper className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <span className="font-mono text-xs line-clamp-2">
                      {contextPreview.headline}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <span className="font-mono text-xs">{contextPreview.dayFact}</span>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          <Button
            onClick={handleConfirm}
            disabled={!selectedDate || !contextPreview || isLoading}
            className="w-full font-mono"
          >
            Confirm Date
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

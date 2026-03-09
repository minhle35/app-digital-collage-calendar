'use client'

import { useDayMark } from '@/lib/DayMarkContext'
import { CANVAS_THEMES, STICKER_PACKS } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Check } from 'lucide-react'

interface ThemeSwitcherProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ThemeSwitcher({ open, onOpenChange }: ThemeSwitcherProps) {
  const { state, dispatch } = useDayMark()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif">Themes & Styles</DialogTitle>
          <DialogDescription className="font-mono text-xs">
            Customize your canvas appearance and sticker pack
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="canvas" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="canvas" className="flex-1 font-mono text-xs">
              Canvas
            </TabsTrigger>
            <TabsTrigger value="stickers" className="flex-1 font-mono text-xs">
              Stickers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="canvas" className="mt-4">
            <div className="grid grid-cols-2 gap-3">
              {CANVAS_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    dispatch({ type: 'SET_CANVAS_THEME', theme: theme.id })
                  }}
                  className={cn(
                    'relative p-4 rounded-lg border-2 transition-all text-left',
                    state.canvasTheme === theme.id
                      ? 'border-accent shadow-md'
                      : 'border-border hover:border-muted-foreground/50'
                  )}
                >
                  {/* Preview swatch */}
                  <div
                    className={cn(
                      'w-full h-16 rounded-md mb-2 grain',
                      theme.bgClass
                    )}
                  />
                  <p className="font-mono text-sm font-medium">{theme.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {theme.isDark ? 'Dark' : 'Light'} theme
                  </p>

                  {state.canvasTheme === theme.id && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-accent-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="stickers" className="mt-4">
            <div className="space-y-3">
              {STICKER_PACKS.map((pack) => (
                <button
                  key={pack.id}
                  onClick={() => {
                    dispatch({ type: 'SET_STICKER_PACK', pack: pack.id })
                  }}
                  className={cn(
                    'relative w-full p-4 rounded-lg border-2 transition-all text-left',
                    state.stickerPack === pack.id
                      ? 'border-accent shadow-md'
                      : 'border-border hover:border-muted-foreground/50'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-sm font-medium">{pack.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {pack.description}
                      </p>
                    </div>

                    {/* Preview stickers */}
                    <div className="flex gap-1">
                      {pack.stickers.slice(0, 4).map((sticker) => (
                        <span key={sticker.id} className="text-xl">
                          {sticker.emoji}
                        </span>
                      ))}
                    </div>
                  </div>

                  {state.stickerPack === pack.id && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-accent-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

import * as React from "react"
import { Settings, Plus, Minus } from "lucide-react"
import { Button } from "./button"
import { Input } from "./input"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"

interface MockDataControllerProps {
  l1Count: number
  l2Count: number
  l3Count: number
  onSave: (l1: number, l2: number, l3: number) => void
}

export function MockDataController({ l1Count, l2Count, l3Count, onSave }: MockDataControllerProps) {
  const [open, setOpen] = React.useState(false)
  const [tempL1, setTempL1] = React.useState(l1Count)
  const [tempL2, setTempL2] = React.useState(l2Count)
  const [tempL3, setTempL3] = React.useState(l3Count)

  const handleCancel = () => {
    setTempL1(l1Count)
    setTempL2(l2Count)
    setTempL3(l3Count)
    setOpen(false)
  }

  const handleSave = () => {
    onSave(tempL1, tempL2, tempL3)
    setOpen(false)
  }

  const handleIncrement = (section: 'l1' | 'l2' | 'l3') => {
    if (section === 'l1' && tempL1 < 15) setTempL1(tempL1 + 1)
    if (section === 'l2' && tempL2 < 15) setTempL2(tempL2 + 1)
    if (section === 'l3' && tempL3 < 15) setTempL3(tempL3 + 1)
  }

  const handleDecrement = (section: 'l1' | 'l2' | 'l3') => {
    if (section === 'l1' && tempL1 > 0) setTempL1(tempL1 - 1)
    if (section === 'l2' && tempL2 > 0) setTempL2(tempL2 - 1)
    if (section === 'l3' && tempL3 > 0) setTempL3(tempL3 - 1)
  }

  const handleInputChange = (section: 'l1' | 'l2' | 'l3', value: string) => {
    const num = parseInt(value, 10)
    if (isNaN(num)) return
    
    const clampedValue = Math.max(0, Math.min(15, num))
    if (section === 'l1') setTempL1(clampedValue)
    if (section === 'l2') setTempL2(clampedValue)
    if (section === 'l3') setTempL3(clampedValue)
  }

  const handleResetDefaults = () => {
    setTempL1(5)
    setTempL2(5)
    setTempL3(5)
  }

  return (
    <div className="fixed bottom-2 left-2 z-50">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            className="h-8 w-8 rounded-full shadow-lg bg-foreground hover:bg-foreground/90 text-background"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          side="top" 
          align="start"
          className="dark w-80 bg-zinc-900 border-zinc-800 text-zinc-100"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Mock data (max 15 per section)</h3>
              <button
                onClick={handleResetDefaults}
                className="text-xs text-zinc-400 hover:text-zinc-100 underline underline-offset-2 transition-colors"
              >
                Reset defaults
              </button>
            </div>
            
            {/* L1 Control */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium w-8">L1</span>
              <div className="flex items-center gap-2 flex-1">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100"
                  onClick={() => handleDecrement('l1')}
                  disabled={tempL1 === 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min="0"
                  max="15"
                  value={tempL1}
                  onChange={(e) => handleInputChange('l1', e.target.value)}
                  className="h-8 w-16 text-center border-zinc-700 bg-zinc-800 text-zinc-100"
                />
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100"
                  onClick={() => handleIncrement('l1')}
                  disabled={tempL1 === 15}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* L2 Control */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium w-8">L2</span>
              <div className="flex items-center gap-2 flex-1">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100"
                  onClick={() => handleDecrement('l2')}
                  disabled={tempL2 === 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min="0"
                  max="15"
                  value={tempL2}
                  onChange={(e) => handleInputChange('l2', e.target.value)}
                  className="h-8 w-16 text-center border-zinc-700 bg-zinc-800 text-zinc-100"
                />
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100"
                  onClick={() => handleIncrement('l2')}
                  disabled={tempL2 === 15}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* L3 Control */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium w-8">L3</span>
              <div className="flex items-center gap-2 flex-1">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100"
                  onClick={() => handleDecrement('l3')}
                  disabled={tempL3 === 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min="0"
                  max="15"
                  value={tempL3}
                  onChange={(e) => handleInputChange('l3', e.target.value)}
                  className="h-8 w-16 text-center border-zinc-700 bg-zinc-800 text-zinc-100"
                />
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100"
                  onClick={() => handleIncrement('l3')}
                  disabled={tempL3 === 15}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                onClick={handleSave}
              >
                Save
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

export interface ColumnConfig {
  id: string
  label: string
  visible: boolean
}

interface SortableItemProps {
  column: ColumnConfig
  onToggle: (id: string) => void
}

function SortableItem({ column, onToggle }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors',
        isDragging && 'opacity-50'
      )}
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Checkbox
        id={column.id}
        checked={column.visible}
        onCheckedChange={() => onToggle(column.id)}
        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />
      <label
        htmlFor={column.id}
        className="flex-1 text-sm font-medium leading-none cursor-pointer select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {column.label}
      </label>
    </div>
  )
}

interface ColumnSettingsProps {
  columns: ColumnConfig[]
  onColumnsChange: (columns: ColumnConfig[]) => void
  onReset: () => void
}

export function ColumnSettings({
  columns,
  onColumnsChange,
  onReset,
}: ColumnSettingsProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: { active: any; over: any }) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = columns.findIndex((col) => col.id === active.id)
      const newIndex = columns.findIndex((col) => col.id === over.id)

      onColumnsChange(arrayMove(columns, oldIndex, newIndex))
    }
  }

  const handleToggle = (id: string) => {
    onColumnsChange(
      columns.map((col) =>
        col.id === id ? { ...col, visible: !col.visible } : col
      )
    )
  }

  return (
    <div className="w-[320px]">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-foreground">Column Settings</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Toggle visibility and reorder columns
        </p>
      </div>

      <div className="space-y-1 mb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={columns.map((col) => col.id)}
            strategy={verticalListSortingStrategy}
          >
            {columns.map((column) => (
              <SortableItem
                key={column.id}
                column={column}
                onToggle={handleToggle}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      <div className="pt-3 border-t border-border">
        <button
          type="button"
          onClick={onReset}
          className="text-sm text-primary hover:underline font-medium"
        >
          Reset to default
        </button>
      </div>
    </div>
  )
}

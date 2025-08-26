'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { addMinutes, differenceInMinutes, isValid } from 'date-fns'

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  allDay: z.boolean().default(false),
  start: z.coerce.date(),
  end: z.coerce.date(),
  recurrence: z.object({
    type: z.enum(['none', 'weekly', 'monthly']).default('none'),
    interval: z.coerce.number().min(1).default(1),
    byWeekday: z.array(z.number().min(0).max(6)).default([]),
    byMonthDay: z.coerce.number().min(1).max(31).optional(),
    until: z.coerce.date().optional(),
  }),
  tags: z.array(z.string()).default([]),
  selectedTag: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function EventDialog({
  open,
  onOpenChange,
  initialRange,
  editing,
  onSaved,
  userId,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  initialRange: { start?: Date; end?: Date; allDay?: boolean }
  editing: {
    id?: string
    title?: string
    start?: Date | string | null
    end?: Date | string | null
    allDay?: boolean
    isRecurring?: boolean
    extendedProps?: { description?: string | null; tags?: { id: string; name: string; color: string }[] }
  } | null
  onSaved: () => void
  userId: string
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      title: '',
      description: '',
      allDay: initialRange.allDay ?? false,
      start: initialRange.start ?? new Date(),
      end: initialRange.end ?? addMinutes(new Date(), 60),
      recurrence: { type: 'none', interval: 1, byWeekday: [] },
      tags: [],
      selectedTag: '',
    },
  })

  useEffect(() => {
    // Only reset form when dialog actually opens or when switching between edit/create modes
    if (!open) return

    if (editing) {
      form.reset({
        title: editing.title ?? '',
        description: editing.extendedProps?.description ?? '',
        allDay: editing.allDay ?? false,
        start: editing.start ? new Date(editing.start) : new Date(),
        end: editing.end ? new Date(editing.end) : addMinutes(new Date(), 60),
        recurrence: { type: editing.isRecurring ? 'weekly' : 'none', interval: 1, byWeekday: [] },
        tags: editing.extendedProps?.tags?.map((t) => t.id) ?? [],
        selectedTag: editing.extendedProps?.tags?.[0]?.id ?? '',
      })
    } else {
      // Reset to default values when creating new event
      form.reset({
        title: '',
        description: '',
        allDay: initialRange.allDay ?? false,
        start: initialRange.start ?? new Date(),
        end: initialRange.end ?? addMinutes(initialRange.start ?? new Date(), 60),
        recurrence: { type: 'none', interval: 1, byWeekday: [] },
        tags: [],
        selectedTag: '',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing?.id, open])

  type EventPayload = {
    title: string
    description?: string | undefined
    allDay: boolean
    start: Date
    end: Date
    tags: string[]
    timeZone: string
    createdBy: string
    rrule?: string
    durationDays?: number
    durationMinutes?: number
    backgroundColor?: string
    borderColor?: string
  }

  async function onSubmit(values: FormValues) {
    const selectedTagData = values.selectedTag ? customTags.find(t => t.id === values.selectedTag) : null
    
    const payload: EventPayload = {
      title: values.title,
      description: values.description,
      allDay: values.allDay,
      start: values.start,
      end: values.end,
      tags: values.selectedTag ? [values.selectedTag] : [],
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      createdBy: userId,
      backgroundColor: selectedTagData?.color,
      borderColor: selectedTagData?.color,
    }

    if (values.recurrence.type !== 'none') {
      // Use local time for RRULE to avoid DST issues
      const dtstart = toLocalDateTimeString(values.start, values.allDay)
      const parts = [`FREQ=${values.recurrence.type.toUpperCase()}`, `INTERVAL=${values.recurrence.interval}`, `DTSTART=${dtstart}`]
      if (values.recurrence.type === 'weekly' && values.recurrence.byWeekday.length) {
        parts.push(`BYDAY=${values.recurrence.byWeekday.map(d => ['SU','MO','TU','WE','TH','FR','SA'][d]).join(',')}`)
      }
      if (values.recurrence.type === 'monthly' && values.recurrence.byMonthDay) {
        parts.push(`BYMONTHDAY=${values.recurrence.byMonthDay}`)
      }
      if (values.recurrence.until && isValid(values.recurrence.until)) {
        parts.push(`UNTIL=${toLocalDateTimeString(values.recurrence.until, values.allDay)}`)
      }
      payload.rrule = parts.join(';')
      if (values.allDay) {
        const days = Math.max(1, Math.ceil((values.end.getTime() - values.start.getTime()) / (1000 * 60 * 60 * 24)))
        payload.durationDays = days
      } else {
        payload.durationMinutes = Math.max(1, differenceInMinutes(values.end, values.start))
      }
    }

    const url = editing?.id ? `/api/events/${editing.id}` : '/api/events'
    const method: 'PATCH' | 'POST' = editing?.id ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) { alert('Failed to save event'); return }
    onOpenChange(false)
    onSaved()
  }

  const weekdays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  
  const [customTags, setCustomTags] = useState([
    { id: 'work', name: 'Work', color: '#3b82f6' },
    { id: 'personal', name: 'Personal', color: '#10b981' },
    { id: 'family', name: 'Family', color: '#f59e0b' },
    { id: 'health', name: 'Health', color: '#ef4444' },
    { id: 'education', name: 'Education', color: '#8b5cf6' },
    { id: 'travel', name: 'Travel', color: '#06b6d4' },
    { id: 'social', name: 'Social', color: '#ec4899' },
    { id: 'hobby', name: 'Hobby', color: '#84cc16' },
  ])
  const [editingTagId, setEditingTagId] = useState<string | null>(null)
  const [editingTagName, setEditingTagName] = useState('')

  // Load custom tag names from localStorage on mount
  useEffect(() => {
    const savedTags = localStorage.getItem('customTags')
    if (savedTags) {
      try {
        setCustomTags(JSON.parse(savedTags))
      } catch (e) {
        console.error('Failed to load custom tags:', e)
      }
    }
  }, [])

  // Save custom tag names to localStorage
  const saveCustomTags = (tags: typeof customTags) => {
    setCustomTags(tags)
    localStorage.setItem('customTags', JSON.stringify(tags))
  }

  const startEditingTag = (tag: typeof customTags[0]) => {
    setEditingTagId(tag.id)
    setEditingTagName(tag.name)
  }

  const saveTagName = async () => {
    if (editingTagId && editingTagName.trim()) {
      // Update locally first for immediate UI feedback
      const updatedTags = customTags.map(tag => 
        tag.id === editingTagId ? { ...tag, name: editingTagName.trim() } : tag
      )
      saveCustomTags(updatedTags)

      // Sync with database
      try {
        await fetch(`/api/tags/${editingTagId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: editingTagName.trim() })
        })
      } catch (error) {
        console.error('Failed to update tag in database:', error)
        // Could show a toast notification here
      }
    }
    setEditingTagId(null)
    setEditingTagName('')
  }

  const cancelEditingTag = () => {
    setEditingTagId(null)
    setEditingTagName('')
  }

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'hidden'}`}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="absolute left-1/2 top-1/2 w-[600px] max-w-[95vw] sm:max-w-[600px] -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-100">{editing ? 'Edit Event' : 'Create New Event'}</h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              {editing ? 'Modify event details' : 'Add a new event to your calendar'}
            </p>
          </div>
          <button 
            onClick={() => onOpenChange(false)} 
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 sm:p-6">
        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Event Title</label>
            <input 
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors" 
              placeholder="Enter event title..."
              {...form.register('title')} 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
            <textarea 
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors resize-none" 
              placeholder="Add a description (optional)..."
              rows={3}
              {...form.register('description')} 
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
              <button
                type="button"
                className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                onClick={() => {
                  // Reset to defaults
                  const defaultTags = [
                    { id: 'work', name: 'Work', color: '#3b82f6' },
                    { id: 'personal', name: 'Personal', color: '#10b981' },
                    { id: 'family', name: 'Family', color: '#f59e0b' },
                    { id: 'health', name: 'Health', color: '#ef4444' },
                    { id: 'education', name: 'Education', color: '#8b5cf6' },
                    { id: 'travel', name: 'Travel', color: '#06b6d4' },
                    { id: 'social', name: 'Social', color: '#ec4899' },
                    { id: 'hobby', name: 'Hobby', color: '#84cc16' },
                  ]
                  saveCustomTags(defaultTags)
                }}
              >
                Reset to defaults
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {customTags.map((tag) => (
                <div key={tag.id} className="relative">
                  {editingTagId === tag.id ? (
                    <div className="flex flex-col gap-1">
                      <input
                        type="text"
                        value={editingTagName}
                        onChange={(e) => setEditingTagName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveTagName()
                          if (e.key === 'Escape') cancelEditingTag()
                        }}
                        className="w-full px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        autoFocus
                        maxLength={12}
                      />
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={saveTagName}
                          className="flex-1 px-1 py-0.5 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          ✓
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditingTag}
                          className="flex-1 px-1 py-0.5 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => form.setValue('selectedTag', form.watch('selectedTag') === tag.id ? '' : tag.id)}
                      onDoubleClick={() => startEditingTag(tag)}
                      className={`relative w-full p-2.5 sm:p-3 rounded-lg border-2 transition-all duration-200 text-xs sm:text-sm font-medium ${
                        form.watch('selectedTag') === tag.id
                          ? 'border-white shadow-lg transform scale-105'
                          : 'border-transparent hover:border-white/30 hover:transform hover:scale-102'
                      }`}
                      style={{ 
                        backgroundColor: tag.color,
                        color: 'white'
                      }}
                      title="Double-click to edit label"
                    >
                      {tag.name}
                      {form.watch('selectedTag') === tag.id && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Double-click any category to customize its label
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={form.watch('allDay')} 
                onChange={(e) => form.setValue('allDay', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">All day event</span>
            </label>
          </div>

                    {/* Mobile: Separate date/time inputs */}
          <div className="block sm:hidden space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Start Date</label>
              <input 
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors text-base" 
                type="date"
                value={toLocalInput(form.watch('start'), true)}
                onChange={(e) => {
                  const currentStart = form.watch('start')
                  const newDate = fromLocalInput(e.target.value, true)
                  const newStart = new Date(newDate)
                  newStart.setHours(currentStart.getHours(), currentStart.getMinutes())
                  form.setValue('start', newStart)
                }}
              />
            </div>
            {!form.watch('allDay') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Start Time</label>
                <input 
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors text-base" 
                  type="time"
                  value={`${String(form.watch('start').getHours()).padStart(2, '0')}:${String(form.watch('start').getMinutes()).padStart(2, '0')}`}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(':').map(Number)
                    const currentStart = form.watch('start')
                    const newStart = new Date(currentStart)
                    newStart.setHours(hours, minutes)
                    form.setValue('start', newStart)
                  }}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">End Date</label>
              <input 
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors text-base" 
                type="date"
                value={toLocalInput(form.watch('end'), true)}
                onChange={(e) => {
                  const currentEnd = form.watch('end')
                  const newDate = fromLocalInput(e.target.value, true)
                  const newEnd = new Date(newDate)
                  newEnd.setHours(currentEnd.getHours(), currentEnd.getMinutes())
                  form.setValue('end', newEnd)
                }}
              />
            </div>
            {!form.watch('allDay') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">End Time</label>
                <input 
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors text-base" 
                  type="time"
                  value={`${String(form.watch('end').getHours()).padStart(2, '0')}:${String(form.watch('end').getMinutes()).padStart(2, '0')}`}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(':').map(Number)
                    const currentEnd = form.watch('end')
                    const newEnd = new Date(currentEnd)
                    newEnd.setHours(hours, minutes)
                    form.setValue('end', newEnd)
                  }}
                />
              </div>
            )}
          </div>

          {/* Desktop: Combined datetime-local inputs */}
          <div className="hidden sm:grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Start Date/Time</label>
              <input 
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors text-base" 
                type={form.watch('allDay') ? 'date' : 'datetime-local'}
                value={toLocalInput(form.watch('start'), form.watch('allDay'))}
                onChange={(e) => form.setValue('start', fromLocalInput(e.target.value, form.watch('allDay')))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">End Date/Time</label>
              <input 
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors text-base" 
                type={form.watch('allDay') ? 'date' : 'datetime-local'}
                value={toLocalInput(form.watch('end'), form.watch('allDay'))}
                onChange={(e) => form.setValue('end', fromLocalInput(e.target.value, form.watch('allDay')))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Repeat</label>
            <select 
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors" 
              value={form.watch('recurrence.type')} 
              onChange={(e) => form.setValue('recurrence.type', e.target.value as FormValues['recurrence']['type'])}
            >
              <option value="none">Does not repeat</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {form.watch('recurrence.type') === 'weekly' && (
            <div className="flex flex-wrap gap-3">
              {weekdays.map((w, i) => (
                <label key={i} className="flex items-center gap-2">
                  <input type="checkbox"
                    checked={form.watch('recurrence.byWeekday').includes(i)}
                    onChange={(e) => {
                      const cur = form.getValues('recurrence.byWeekday')
                      form.setValue('recurrence.byWeekday', e.target.checked ? Array.from(new Set([...cur, i])) : cur.filter((d) => d !== i))
                    }}
                  />
                  <span>{w}</span>
                </label>
              ))}
            </div>
          )}

          {form.watch('recurrence.type') === 'monthly' && (
            <div>
              <label className="block text-sm font-medium">Day of month</label>
              <input className="w-full rounded border px-3 py-2" type="number" min={1} max={31} {...form.register('recurrence.byMonthDay', { valueAsNumber: true })} />
            </div>
          )}

          {form.watch('recurrence.type') !== 'none' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium">Interval</label>
                <input className="w-full rounded border px-3 py-2" type="number" min={1} {...form.register('recurrence.interval', { valueAsNumber: true })} />
              </div>
              <div>
                <label className="block text-sm font-medium">End (UNTIL, optional)</label>
                <input className="w-full rounded border px-3 py-2" type="date" onChange={(e) => form.setValue('recurrence.until', e.target.value ? new Date(e.target.value) : undefined)} />
              </div>
            </div>
          )}

                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            {editing?.id && (
              <button 
                type="button" 
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
                onClick={async () => {
                  const res = await fetch(`/api/events/${editing.id}`, { method: 'DELETE' })
                  if (!res.ok) return alert('Delete failed')
                  onOpenChange(false); onSaved()
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            )}
            <div className="flex gap-3">
              <button 
                type="button" 
                className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors duration-200 font-medium text-sm sm:text-base" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {editing ? 'Save Changes' : 'Create Event'}
              </button>
            </div>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}

// Note: Keeping this function for potential future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function toUTCDateTimeString(d: Date) {
  const s = new Date(d)
  const iso = s.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
  return iso
}

function toLocalDateTimeString(d: Date, allDay: boolean) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  
  if (allDay) {
    // For all-day events, use date only format
    return `${year}${month}${day}`
  } else {
    // For timed events, use local time format
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const seconds = String(d.getSeconds()).padStart(2, '0')
    return `${year}${month}${day}T${hours}${minutes}${seconds}`
  }
}

function toLocalInput(d: Date | undefined, allDay: boolean) {
  if (!d) return ''
  const dt = new Date(d)
  if (allDay) {
    // For all-day events, use local date
    const pad = (n: number) => `${n}`.padStart(2, '0')
    const yyyy = dt.getFullYear()
    const mm = pad(dt.getMonth() + 1)
    const dd = pad(dt.getDate())
    return `${yyyy}-${mm}-${dd}`
  }
  // For timed events, adjust for timezone offset to get local time
  const localDate = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 16)
}
function fromLocalInput(v: string, allDay: boolean) {
  if (!v) return new Date()
  if (allDay) {
    // For all-day events, create date at midnight local time
    const [year, month, day] = v.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  // For timed events, the datetime-local input gives us local time
  // We need to convert it to the correct local Date object
  return new Date(v)
}

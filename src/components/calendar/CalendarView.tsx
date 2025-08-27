'use client'

import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import rrulePlugin from '@fullcalendar/rrule'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CalendarApi } from '@fullcalendar/core'
import type { EditingEvent } from './types'
import EventDialog from './EventDialog'
import ProfileDialog from './ProfileDialog'

export default function CalendarView({ userId }: { userId: string }) {
  const calRef = useRef<FullCalendar | null>(null)
  const [open, setOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<EditingEvent | null>(null)
  const [initialRange, setInitialRange] = useState<{ start?: Date; end?: Date; allDay?: boolean }>({})
  const [isMobile, setIsMobile] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)')
    const onChange = () => setIsMobile(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  function refresh() { calRef.current?.getApi().refetchEvents() }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const api: CalendarApi | undefined = calRef.current?.getApi()
      if (!api) return
      if (e.key === 'ArrowLeft') api.prev()
      if (e.key === 'ArrowRight') api.next()
      if (e.key.toLowerCase() === 'n') { setEditingEvent(null); setInitialRange({}); setOpen(true) }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') { e.preventDefault(); window.print() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const headerToolbar = useMemo(() => ({
    left: 'prev,next today',
    center: 'title',
    right: isMobile ? 'dayGridMonth,timeGridWeek' : 'dayGridMonth,timeGridWeek',
  }), [isMobile])

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>
      </div>
      
      <div className="relative z-10 p-3 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Mobile Header */}
          <div className="block sm:hidden mb-4 no-print">
            <div className="backdrop-blur-sm bg-white/10 rounded-xl p-4 border border-white/20 mb-3">
              <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">Jennifer&apos;s Awesome Calendar</h1>
              <p className="text-white/80 text-sm">Organize your family&apos;s life</p>
            </div>
            <div className="flex gap-2">
              <button 
                className="px-3 py-2.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg hover:bg-white/30 transition-all duration-300 flex items-center justify-center text-white shadow-lg"
                onClick={() => setProfileOpen(true)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
              <button 
                className="px-3 py-2.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg hover:bg-white/30 transition-all duration-300 flex items-center justify-center text-white shadow-lg"
                onClick={() => window.print()}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              </button>
              <button 
                className="flex-1 group px-4 py-2.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg transition-all duration-300 flex items-center justify-center gap-2 font-semibold text-sm shadow-lg"
                onClick={() => { setEditingEvent(null); setInitialRange({}); setOpen(true) }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Event
              </button>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden sm:flex items-center justify-between mb-8 no-print">
            <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-6 border border-white/20">
              <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Jennifer&apos;s Awesome Calendar</h1>
              <p className="text-white/80 text-lg">Beautifully organize your family&apos;s life</p>
            </div>
            <div className="flex gap-4">
              <button 
                className="group px-4 py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl hover:bg-white/30 transition-all duration-300 flex items-center gap-3 text-white font-medium shadow-lg hover:shadow-xl hover:scale-105"
                onClick={() => setProfileOpen(true)}
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
              </button>
              <button 
                className="group px-6 py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl hover:bg-white/30 transition-all duration-300 flex items-center gap-3 text-white font-medium shadow-lg hover:shadow-xl hover:scale-105"
                onClick={() => window.print()}
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Calendar
              </button>
              <button 
                className="group px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white rounded-xl transition-all duration-300 flex items-center gap-3 font-semibold shadow-lg hover:shadow-xl hover:scale-105"
                onClick={() => { setEditingEvent(null); setInitialRange({}); setOpen(true) }}
              >
                <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Event
              </button>
            </div>
          </div>
          
          <FullCalendar
            ref={(r) => { calRef.current = r }}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, rrulePlugin]}
            initialView={isMobile ? 'timeGridWeek' : 'dayGridMonth'}
            headerToolbar={headerToolbar}
            height="auto"
            selectable
            editable
            droppable={false}
            eventOverlap
            timeZone="local"
            firstDay={1}
            selectMirror
            longPressDelay={250}
            fixedWeekCount={false}
            showNonCurrentDates={false}
            eventSources={[{ id: 'events', url: '/api/events', method: 'GET' }]}
            select={(info) => { setEditingEvent(null); setInitialRange({ start: info.start, end: info.end, allDay: info.allDay }); setOpen(true) }}
            eventClick={(info) => {
              const ev = info.event
              const isRecurring = Boolean((ev as unknown as { _def?: { recurringDef?: unknown } })._def?.recurringDef)
              setEditingEvent({ id: ev.id, title: ev.title, start: ev.start, end: ev.end, allDay: ev.allDay, isRecurring, extendedProps: ev.extendedProps as EditingEvent['extendedProps'] })
              setOpen(true)
            }}
            eventDrop={async (info) => {
              const ev = info.event
              const isRecurring = Boolean((ev as unknown as { _def?: { recurringDef?: unknown } })._def?.recurringDef)
              if (isRecurring) { info.revert(); alert('Drag/resizing recurring series is not supported in v1. Edit via the form.'); return }
              await fetch(`/api/events/${ev.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ start: ev.start, end: ev.end, allDay: ev.allDay }) })
              refresh()
            }}
            eventResize={async (info) => {
              const ev = info.event
              const isRecurring = Boolean((ev as unknown as { _def?: { recurringDef?: unknown } })._def?.recurringDef)
              if (isRecurring) { info.revert(); alert('Resizing recurring series is not supported in v1. Edit via the form.'); return }
              await fetch(`/api/events/${ev.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ start: ev.start, end: ev.end, allDay: ev.allDay }) })
              refresh()
            }}
          />

          <EventDialog open={open} onOpenChange={setOpen} initialRange={initialRange} editing={editingEvent} onSaved={refresh} userId={userId} />
          <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} userId={userId} />
        </div>
      </div>
    </div>
  )
}

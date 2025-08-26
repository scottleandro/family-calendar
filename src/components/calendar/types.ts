export interface TagRef {
  id: string
  name: string
  color: string
}

export interface EditingEvent {
  id: string
  title: string
  start: Date | string | null
  end: Date | string | null
  allDay: boolean
  isRecurring: boolean
  extendedProps?: {
    description?: string | null
    tags?: TagRef[]
  }
}



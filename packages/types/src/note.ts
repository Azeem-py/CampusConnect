export interface PersonalNote {
  id: string
  title: string | null
  content: string
  images: string[]
  userId: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
  sharedWith?: NoteAccess[]
  user?: { id: string; name: string | null; username: string; avatar: string | null }
}

export interface NoteAccess {
  id: string
  noteId: string
  userId: string
  permission: 'READ' | 'WRITE'
  user?: { id: string; name: string | null; username: string; avatar: string | null }
}

export interface CreateNoteDto {
  title?: string
  content: string
  images?: string[]
  isPublic?: boolean
}

export interface UpdateNoteDto {
  title?: string
  content?: string
  images?: string[]
  isPublic?: boolean
}

export interface ShareNoteDto {
  userIds: string[]
  permission: 'READ' | 'WRITE'
}

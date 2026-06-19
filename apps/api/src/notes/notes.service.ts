import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { NOTIFICATION_EVENT } from '../notifications/notification-listener.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { ShareNoteDto } from './dto/share-note.dto';

@Injectable()
export class NotesService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  private notesInclude = {
    sharedWith: {
      include: {
        user: {
          select: { id: true, name: true, username: true, avatar: true },
        },
      },
    },
    user: {
      select: { id: true, name: true, username: true, avatar: true },
    },
  } as const;

  async findMyNotes(userId: string) {
    return this.prisma.personalNote.findMany({
      where: { userId },
      include: this.notesInclude,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findSharedWithMe(userId: string) {
    return this.prisma.personalNote.findMany({
      where: {
        sharedWith: { some: { userId } },
      },
      include: this.notesInclude,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findPublicNotes(userId: string) {
    return this.prisma.personalNote.findMany({
      where: { userId, isPublic: true },
      include: this.notesInclude,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(noteId: string, currentUserId: string) {
    const { note, role } = await this.canAccess(noteId, currentUserId);
    if (!note) throw new NotFoundException('Note not found');
    return note;
  }

  async create(userId: string, dto: CreateNoteDto) {
    const note = await this.prisma.personalNote.create({
      data: {
        title: dto.title,
        content: dto.content,
        images: dto.images ?? [],
        isPublic: dto.isPublic ?? false,
        userId,
      },
      include: this.notesInclude,
    });
    return note;
  }

  async update(noteId: string, currentUserId: string, dto: UpdateNoteDto) {
    const { note, role } = await this.canAccess(noteId, currentUserId);
    if (!note) throw new NotFoundException('Note not found');
    if (role !== 'owner' && role !== 'editor') {
      throw new BadRequestException('You do not have permission to edit this note');
    }

    const updated = await this.prisma.personalNote.update({
      where: { id: noteId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.images !== undefined && { images: dto.images }),
        ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
      },
      include: this.notesInclude,
    });
    return updated;
  }

  async delete(noteId: string, currentUserId: string) {
    const { note, role } = await this.canAccess(noteId, currentUserId);
    if (!note) throw new NotFoundException('Note not found');
    if (role !== 'owner') {
      throw new BadRequestException('Only the owner can delete this note');
    }

    await this.prisma.personalNote.delete({ where: { id: noteId } });
    return { message: 'Note deleted successfully' };
  }

  async share(noteId: string, ownerId: string, dto: ShareNoteDto) {
    const { note, role } = await this.canAccess(noteId, ownerId);
    if (!note) throw new NotFoundException('Note not found');
    if (role !== 'owner') {
      throw new BadRequestException('Only the owner can share this note');
    }

    // Cannot share with self
    if (dto.userIds.includes(ownerId)) {
      throw new BadRequestException('You cannot share a note with yourself');
    }

    // Validate all target users exist
    const users = await this.prisma.user.findMany({
      where: { id: { in: dto.userIds } },
      select: { id: true, name: true },
    });
    if (users.length !== dto.userIds.length) {
      throw new BadRequestException('One or more users not found');
    }

    // Create NoteAccess records (skip already-existing entries)
    const existingAccess = await this.prisma.noteAccess.findMany({
      where: { noteId, userId: { in: dto.userIds } },
    });
    const existingUserIds = new Set(existingAccess.map((a) => a.userId));

    const toCreate = dto.userIds
      .filter((uid) => !existingUserIds.has(uid))
      .map((userId) => ({
        noteId,
        userId,
        permission: dto.permission,
      }));

    if (toCreate.length > 0) {
      await this.prisma.noteAccess.createMany({ data: toCreate });
    }

    // Send notifications only to newly-added users
    const noteTitle = note.title || 'Untitled';
    for (const entry of toCreate) {
      await this.eventEmitter.emitAsync(NOTIFICATION_EVENT, {
        recipientId: entry.userId,
        type: 'NOTE_SHARE' as any,
        actorId: ownerId,
        metadata: {
          noteId,
          noteTitle,
          permission: entry.permission,
        },
      });
    }

    return this.prisma.personalNote.findUnique({
      where: { id: noteId },
      include: this.notesInclude,
    });
  }

  async updateAccess(noteId: string, ownerId: string, targetUserId: string, permission: string) {
    const { note, role } = await this.canAccess(noteId, ownerId);
    if (!note) throw new NotFoundException('Note not found');
    if (role !== 'owner') {
      throw new BadRequestException('Only the owner can manage access');
    }
    if (targetUserId === ownerId) {
      throw new BadRequestException('Cannot change your own access');
    }

    const access = await this.prisma.noteAccess.findUnique({
      where: { noteId_userId: { noteId, userId: targetUserId } },
    });
    if (!access) throw new NotFoundException('Access entry not found');

    await this.prisma.noteAccess.update({
      where: { id: access.id },
      data: { permission },
    });

    return this.prisma.personalNote.findUnique({
      where: { id: noteId },
      include: this.notesInclude,
    });
  }

  async removeAccess(noteId: string, ownerId: string, targetUserId: string) {
    const { note, role } = await this.canAccess(noteId, ownerId);
    if (!note) throw new NotFoundException('Note not found');
    if (role !== 'owner') {
      throw new BadRequestException('Only the owner can manage access');
    }
    if (targetUserId === ownerId) {
      throw new BadRequestException('Cannot remove your own access');
    }

    const access = await this.prisma.noteAccess.findUnique({
      where: { noteId_userId: { noteId, userId: targetUserId } },
    });
    if (!access) throw new NotFoundException('Access entry not found');

    await this.prisma.noteAccess.delete({ where: { id: access.id } });

    return this.prisma.personalNote.findUnique({
      where: { id: noteId },
      include: this.notesInclude,
    });
  }

  private async canAccess(
    noteId: string,
    userId: string,
  ): Promise<{ note: any; role: 'owner' | 'editor' | 'reader' | null }> {
    const note = await this.prisma.personalNote.findUnique({
      where: { id: noteId },
      include: this.notesInclude,
    });
    if (!note) return { note: null, role: null };

    if (note.userId === userId) return { note, role: 'owner' };
    if (note.isPublic) return { note, role: 'reader' };

    const access = note.sharedWith.find((a) => a.userId === userId);
    if (access) {
      return { note, role: access.permission === 'WRITE' ? 'editor' : 'reader' };
    }

    return { note: null, role: null };
  }
}

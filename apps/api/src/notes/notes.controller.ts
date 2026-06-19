import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCookieAuth, ApiResponse } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { ShareNoteDto } from './dto/share-note.dto';
import { UpdateAccessDto } from './dto/update-access.dto';

@ApiTags('Notes')
@Controller('api/v1/notes')
export class NotesController {
  constructor(private notesService: NotesService) {}

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all notes for the current user' })
  @ApiCookieAuth('token')
  async getMyNotes(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.notesService.findMyNotes(userId);
  }

  @Get('shared-with-me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get notes shared with the current user' })
  @ApiCookieAuth('token')
  async getSharedWithMe(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.notesService.findSharedWithMe(userId);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get public notes of a specific user' })
  @ApiCookieAuth('token')
  async getUserPublicNotes(@Param('userId') userId: string) {
    return this.notesService.findPublicNotes(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a single note by ID' })
  @ApiCookieAuth('token')
  @ApiResponse({ status: 404, description: 'Note not found' })
  async getNote(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user.id;
    return this.notesService.findOne(id, userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new personal note' })
  @ApiCookieAuth('token')
  async createNote(@Body() dto: CreateNoteDto, @Req() req: Request) {
    const userId = (req as any).user.id;
    return this.notesService.create(userId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a note' })
  @ApiCookieAuth('token')
  async updateNote(
    @Param('id') id: string,
    @Body() dto: UpdateNoteDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.notesService.update(id, userId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a note' })
  @ApiCookieAuth('token')
  async deleteNote(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user.id;
    return this.notesService.delete(id, userId);
  }

  @Post(':id/share')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Share a note with other users' })
  @ApiCookieAuth('token')
  async shareNote(
    @Param('id') id: string,
    @Body() dto: ShareNoteDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.notesService.share(id, userId, dto);
  }

  @Patch(':id/share/:targetUserId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update permission for a shared user' })
  @ApiCookieAuth('token')
  async updateAccess(
    @Param('id') id: string,
    @Param('targetUserId') targetUserId: string,
    @Body() dto: UpdateAccessDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.notesService.updateAccess(id, userId, targetUserId, dto.permission);
  }

  @Delete(':id/share/:targetUserId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Remove a user access from a note' })
  @ApiCookieAuth('token')
  async removeAccess(
    @Param('id') id: string,
    @Param('targetUserId') targetUserId: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.notesService.removeAccess(id, userId, targetUserId);
  }
}

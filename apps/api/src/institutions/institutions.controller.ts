import { Controller, Get, Param, ParseEnumPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { InstitutionType } from '@prisma/client';
import { InstitutionsService } from './institutions.service';

@ApiTags('Institutions')
@Controller('api/v1/institutions')
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all institutions, optionally filtered by type' })
  @ApiQuery({ name: 'type', required: false, enum: InstitutionType, description: 'Filter by institution type' })
  @ApiResponse({ status: 200, description: 'List of institutions' })
  async findAll(@Query('type') type?: string) {
    return this.institutionsService.findAll(type);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single institution with its departments' })
  @ApiResponse({ status: 200, description: 'Institution details' })
  @ApiResponse({ status: 404, description: 'Institution not found' })
  async findOne(@Param('id') id: string) {
    return this.institutionsService.findOne(id);
  }

  @Get(':id/departments')
  @ApiOperation({ summary: 'Get departments for a specific institution' })
  @ApiResponse({ status: 200, description: 'List of departments' })
  async getDepartments(@Param('id') id: string) {
    return this.institutionsService.getDepartments(id);
  }
}

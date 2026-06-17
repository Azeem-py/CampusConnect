import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { BannedWordFilter } from './banned-word.filter';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [AdminController],
  providers: [AdminService, BannedWordFilter],
  exports: [AdminService, BannedWordFilter],
})
export class AdminModule {}

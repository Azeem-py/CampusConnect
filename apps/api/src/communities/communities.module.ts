import { Module } from '@nestjs/common';
import { CommunitiesController } from './communities.controller';
import { CommunitiesGroupsController } from './communities-groups.controller';
import { QuizzesController } from './quizzes/quizzes.controller';
import { CommunitiesService } from './communities.service';
import { CommunitiesGroupsService } from './communities-groups.service';
import { QuizzesService } from './quizzes/quizzes.service';
import { CommunityRoleGuard } from './guards/community-role.guard';
import { GroupRoleGuard } from './guards/group-role.guard';

@Module({
  controllers: [CommunitiesController, CommunitiesGroupsController, QuizzesController],
  providers: [CommunitiesService, CommunitiesGroupsService, QuizzesService, CommunityRoleGuard, GroupRoleGuard],
  exports: [CommunitiesService, CommunitiesGroupsService, QuizzesService],
})
export class CommunitiesModule {}

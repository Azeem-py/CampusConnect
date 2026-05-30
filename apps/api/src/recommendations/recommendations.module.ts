import { Module } from '@nestjs/common';
import { InteractionMatrixService } from './interaction-matrix.service';
import { TfidfService } from './tfidf.service';
import { SvdService } from './svd.service';
import { KnnService } from './knn.service';
import { RecommendationService } from './recommendation.service';

/**
 * FIX M4 — ScheduleModule.forRoot() removed from here.
 * It must be registered exactly once at the AppModule level to prevent
 * duplicate scheduler instances and double Cron fires.
 */
@Module({
  providers: [
    InteractionMatrixService,
    TfidfService,
    SvdService,
    KnnService,
    RecommendationService,
  ],
  exports: [RecommendationService, InteractionMatrixService, KnnService],
})
export class RecommendationsModule {}

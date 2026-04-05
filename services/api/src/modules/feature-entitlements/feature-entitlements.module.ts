import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { FeatureEntitlementsController } from './feature-entitlements.controller';
import { FeatureEntitlementsService } from './feature-entitlements.service';

@Module({
  imports: [DatabaseModule],
  controllers: [FeatureEntitlementsController],
  providers: [FeatureEntitlementsService],
  exports: [FeatureEntitlementsService],
})
export class FeatureEntitlementsModule {}

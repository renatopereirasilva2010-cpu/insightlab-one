import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ServicesCatalogController } from './services-catalog.controller';
import { ServicesCatalogService } from './services-catalog.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ServicesCatalogController],
  providers: [ServicesCatalogService],
  exports: [ServicesCatalogService],
})
export class ServicesCatalogModule {}

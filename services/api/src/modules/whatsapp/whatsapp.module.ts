import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from './whatsapp.service';
import { WHATSAPP_PROVIDER } from './providers/whatsapp-provider.interface';
import { NullWhatsAppProvider } from './providers/null-whatsapp-provider';
import { MetaCloudApiWhatsAppProvider } from './providers/meta-cloud-api-whatsapp-provider';

@Module({
  imports: [DatabaseModule],
  controllers: [WhatsAppController],
  providers: [
    WhatsAppService,
    NullWhatsAppProvider,
    MetaCloudApiWhatsAppProvider,
    {
      provide: WHATSAPP_PROVIDER,
      useFactory: (
        nullProvider: NullWhatsAppProvider,
        metaProvider: MetaCloudApiWhatsAppProvider,
      ) =>
        process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID
          ? metaProvider
          : nullProvider,
      inject: [NullWhatsAppProvider, MetaCloudApiWhatsAppProvider],
    },
  ],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}

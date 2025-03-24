import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { LocationModule } from './location/location.module';
import { ProposalModule } from './proposal/proposal.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [UserModule, LocationModule, ProposalModule, NotificationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

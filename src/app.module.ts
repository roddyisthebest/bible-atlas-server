import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { LocationModule } from './location/location.module';
import { ProposalModule } from './proposal/proposal.module';
import { NotificationModule } from './notification/notification.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProposalAgreement } from './proposal/entities/proposal-agreement.entity';
import { Proposal } from './proposal/entities/proposal.entity';
import { Location } from './location/entities/location.entity';
import { Notification } from './notification/entities/notification.entity';
import { UserLocationLike } from './user/entities/user-location-like.entity';
import { UserLocationReport } from './user/entities/user-location-report.entity';
import { UserLocationSave } from './user/entities/user-location-save.entity';
import { UserProposalReport } from './user/entities/user-proposal-report.entity';
import { User } from './user/entities/user.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 전체에서 사용 가능
    }),
    TypeOrmModule.forRoot({
      type: process.env.DB_TYPE as 'postgres',
      host: process.env.DB_HOST,
      port: +(process.env.DB_PORT as string),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [
        ProposalAgreement,
        Proposal,
        Location,
        Notification,
        UserLocationLike,
        UserLocationReport,
        UserLocationSave,
        UserProposalReport,
        User,
      ],
      synchronize: process.env.ENV === 'dev' ? true : false,
    }),

    UserModule,
    LocationModule,
    ProposalModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

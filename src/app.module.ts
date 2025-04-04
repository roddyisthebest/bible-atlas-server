import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';

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
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { envVariables } from './common/const/env.const';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth/guard/auth.guard';
import { AttatchUserMiddleware } from './auth/middleware/attatch-user.middleware';
import { RoleGuard } from './auth/guard/role.guard';
import { AdminLocationModule } from './admin-location/admin-location.module';
import { CommonModule } from './common/common.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ReportModule } from './report/report.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 전체에서 사용 가능
      validationSchema: Joi.object({
        [envVariables.env]: Joi.string().valid('dev', 'prod').required(),
        [envVariables.dbType]: Joi.string().valid('postgres').required(),
        [envVariables.dbHost]: Joi.string().required(),
        [envVariables.dbPort]: Joi.string().required(),
        [envVariables.dbUsername]: Joi.string().required(),
        [envVariables.dbPassword]: Joi.string().required(),
        [envVariables.dbDatabase]: Joi.string().required(),
        [envVariables.hasRounds]: Joi.number().required(),
        [envVariables.accessTokenSecret]: Joi.string().required(),
        [envVariables.refreshTokenSecret]: Joi.string().required(),
        [envVariables.kakaoBaseUrl]: Joi.string().required(),
        [envVariables.syncProposalCountsCron]: Joi.string().required(),
      }),
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: configService.get<string>(envVariables.dbType) as 'postgres',
        host: configService.get<string>(envVariables.dbHost),
        port: +(configService.get<string>(envVariables.dbPort) as string),
        username: configService.get<string>(envVariables.dbUsername),
        password: configService.get<string>(envVariables.dbPassword),
        database: configService.get<string>(envVariables.dbDatabase),
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
        synchronize:
          configService.get<string>(envVariables.env) === 'dev' ? true : false,
      }),
      inject: [ConfigService],
    }),
    UserModule,
    LocationModule,
    ProposalModule,
    NotificationModule,
    AuthModule,
    AdminLocationModule,
    CommonModule,
    ScheduleModule.forRoot(),
    ReportModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RoleGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AttatchUserMiddleware)
      .exclude(
        {
          path: 'auth/login',
          method: RequestMethod.POST,
        },
        {
          path: 'auth/register',
          method: RequestMethod.POST,
        },
        {
          path: 'location',
          method: RequestMethod.GET,
        },
        {
          path: 'location/within',
          method: RequestMethod.GET,
        },
        {
          path: 'location/:id',
          method: RequestMethod.GET,
        },
      )
      .forRoutes('*');
  }
}

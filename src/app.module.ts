import { Module } from '@nestjs/common';
import { UserController } from './controller/user.controller';
import { UserService } from './service/user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserSchema } from './schema/user.schema';
import { HttpModule } from '@nestjs/axios';
import { EmailService } from './service/email.service';
import { AvatarSchema } from './schema/avatar.schema';
import { EventService } from './service/event.service';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),

    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),

    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Avatar', schema: AvatarSchema },
    ]),

    HttpModule,
  ],
  controllers: [UserController],
  providers: [UserService, EmailService, EventService],
})
export class AppModule {}

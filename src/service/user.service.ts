import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AxiosResponse } from 'axios';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import { Model } from 'mongoose';
import * as path from 'path';
import { lastValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { AVATARS_DIR, REQES_BASE_URL } from '../constants/common.constants';
import { ReqResUserDto } from '../dto/reqres/reqres-user.dto';
import { Avatar, AvatarDocument } from '../schema/avatar.schema';
import { User, UserDocument } from '../schema/user.schema';
import { calculateBufferHash } from '../utils/crypto.utils';
import { EmailService } from './email.service';
import { EventService } from './event.service';

@Injectable()
export class UserService {
  constructor(
    private readonly httpService: HttpService,
    private readonly emailService: EmailService,
    private readonly eventService: EventService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Avatar.name) private avatarModel: Model<AvatarDocument>,
  ) {}

  public async create(user: User): Promise<User> {
    try {
      const createdUser = await this.userModel.create(user);

      // Send dummy email and dummy event only after user created succefully
      if (createdUser) {
        // Sending a dummy email
        this.emailService.sendDummyEmail(
          user.email,
          'User created',
          'A user have been created',
        );

        // Sending a dummy RabbitMQ event
        const message: object = {
          action: 'User created',
          payload: createdUser,
        };
        this.eventService.sendDummyEvent(message, 'users-queue');
      }
      return createdUser;
    } catch (error) {
      console.error(`Failed to create user with data: ${user}`, error);
    }
  }

  public async getUserById(userId: number): Promise<ReqResUserDto> {
    const GET_USER_BY_ID_URL = `${REQES_BASE_URL}/${userId}`;

    try {
      const response: AxiosResponse<ReqResUserDto> = await lastValueFrom(
        this.httpService.get<ReqResUserDto>(GET_USER_BY_ID_URL).pipe(),
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to retrieve user data for ID ${userId}`, error);
    }
  }

  public async fetchAvatarByUserId(userId: number): Promise<Buffer> {
    try {
      const USER: ReqResUserDto = await this.getUserById(userId);
      const AVATAR_URL: string = USER.data.avatar;

      const response = await lastValueFrom(
        this.httpService.get(AVATAR_URL, { responseType: 'arraybuffer' }),
      );

      return Buffer.from(response.data);
    } catch (error) {
      console.error(
        `Failed to retrieve avatar for user with ID ${userId}`,
        error,
      );
    }
  }

  public async saveAvatar(
    userId: number,
    avatarBuffer: Buffer,
  ): Promise<Avatar> {
    const AVATAR_HASH: string = calculateBufferHash(avatarBuffer);
    const GENERATED_AVATAR_FILENAME: string = `${userId}_${uuidv4()}.jpg`;

    const avatar = new Avatar(userId, AVATAR_HASH, GENERATED_AVATAR_FILENAME);
    const CREATED_AVATAR: Promise<Avatar> = this.avatarModel.create(avatar);

    try {
      const fullPath = path.join(AVATARS_DIR, GENERATED_AVATAR_FILENAME);
      fsPromises.writeFile(fullPath, avatarBuffer);
    } catch (error) {
      console.error(`Error saving avatar for userId: ${userId}`, error);
    }

    return CREATED_AVATAR;
  }

  public async getAvatarByUserId(userId: number): Promise<Buffer> {
    try {
      const AVATAR = await this.avatarModel.findOne({ userId: userId });

      if (AVATAR) {
        const AVATAR_PATH = path.join(AVATARS_DIR, AVATAR.filename);
        return fs.readFileSync(AVATAR_PATH);
      }

      const avatarBuffer: Buffer = await this.fetchAvatarByUserId(userId);
      this.saveAvatar(userId, avatarBuffer);
      return avatarBuffer;
    } catch (error) {
      console.error(`Error fetching avatar for userId: ${userId}`, error);
    }
  }

  public async deleteAvatarById(userId: number): Promise<undefined> {
    try {
      const deletedAvatar = await this.avatarModel.deleteMany({
        userId: userId,
      });
      if (deletedAvatar.acknowledged == false) {
        throw Error(`Error deleting file from database with userId: ${userId}`);
      }

      const files = await fsPromises.readdir(AVATARS_DIR);
      const filesToDelete = files.filter((file) =>
        file.startsWith(`${userId}_`),
      );

      for (const file of filesToDelete) {
        const filePath = path.join(AVATARS_DIR, file);
        await fsPromises.unlink(filePath);
      }
    } catch (error) {
      console.error(`Error deleting avatars for userId: ${userId}`, error);
    }
  }
}

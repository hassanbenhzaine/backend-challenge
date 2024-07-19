import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { HttpService } from '@nestjs/axios';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import { Model } from 'mongoose';
import * as path from 'path';
import { of } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import {
  AVATARS_DIR,
  REQES_BASE_URL,
} from '../../../src/constants/common.constants';
import { ReqResUserDto } from '../../../src/dto/reqres/reqres-user.dto';
import { Avatar, AvatarDocument } from '../../../src/schema/avatar.schema';
import { User, UserDocument } from '../../../src/schema/user.schema';
import { EmailService } from '../../../src/service/email.service';
import { EventService } from '../../../src/service/event.service';
import { UserService } from '../../../src/service/user.service';
import { calculateBufferHash } from '../../../src/utils/crypto.utils';

const EXPECTED_UUID = 'db35bb47-3eef-4cab-8737-36e833066199';

jest.mock('fs');
jest.mock('fs/promises');
jest.mock('uuid', () => ({
  v4: jest.fn(() => EXPECTED_UUID),
}));

describe('UserService', () => {
  let userService: UserService;
  let httpService: HttpService;
  let eventService: EventService;
  let emailService: EmailService;
  let userModel: Model<UserDocument>;
  let avatarModel: Model<AvatarDocument>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        HttpService,
        EmailService,
        EventService,
        {
          provide: getModelToken('User'),
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: getModelToken('Avatar'),
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
            deleteMany: jest.fn(),
          },
        },
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    httpService = module.get<HttpService>(HttpService);
    eventService = module.get<EventService>(EventService);
    emailService = module.get<EmailService>(EmailService);
    userModel = module.get<Model<UserDocument>>(getModelToken(User.name));
    avatarModel = module.get<Model<AvatarDocument>>(getModelToken(Avatar.name));
  });

  it('should create a user then send dummy email and dummy event then return the created user', async () => {
    const userToCreate = new User();
    userToCreate.setName('John');
    userToCreate.setId(1);
    userToCreate.setEmail('john@example.com');
    userToCreate.setJob('SWE');

    const createdUser = new User();
    createdUser.set_Id(uuidv4());
    createdUser.setName('John');
    createdUser.setId(1);
    createdUser.setEmail('john@example.com');
    createdUser.setJob('SWE');

    jest
      .spyOn(userModel, 'create')
      .mockResolvedValueOnce(Promise.resolve(createdUser) as any);

    jest.spyOn(emailService, 'sendDummyEmail');
    jest.spyOn(eventService, 'sendDummyEvent');

    const result = await userService.create(userToCreate);

    // Assertions
    expect(userModel.create).toHaveBeenCalledTimes(1);
    expect(emailService.sendDummyEmail).toHaveBeenCalledTimes(1);
    expect(eventService.sendDummyEvent).toHaveBeenCalledTimes(1);

    expect(result).toEqual(createdUser);
    expect(userModel.create).toHaveBeenCalledWith(userToCreate);
  });

  it('should retrieve user data by ID', async () => {
    const MOCK_USER_RESPONSE: ReqResUserDto = {
      data: {
        id: 2,
        email: 'janet.weaver@reqres.in',
        first_name: 'Janet',
        last_name: 'Weaver',
        avatar: 'https://reqres.in/img/faces/2-image.jpg',
      },
      support: {
        url: 'https://reqres.in/#support-heading',
        text: 'To keep ReqRes free, contributions towards server costs are appreciated!',
      },
    };

    const MOCK_USER_ID: number = MOCK_USER_RESPONSE.data.id;
    const GET_USER_BY_ID_URL: string = `${REQES_BASE_URL}/${MOCK_USER_ID}`;

    httpService.get = jest
      .fn()
      .mockReturnValue(of({ data: MOCK_USER_RESPONSE }));

    const result = await userService.getUserById(MOCK_USER_ID);

    // Assertions
    expect(httpService.get).toHaveBeenCalledTimes(1);
    expect(result).toEqual(MOCK_USER_RESPONSE);
    expect(httpService.get).toHaveBeenCalledWith(GET_USER_BY_ID_URL);
  });

  it('should fetch avatar by user ID', async () => {
    const MOCK_USER_RESPONSE: ReqResUserDto = {
      data: {
        id: 2,
        email: 'janet.weaver@reqres.in',
        first_name: 'Janet',
        last_name: 'Weaver',
        avatar: 'https://reqres.in/img/faces/2-image.jpg',
      },
      support: {
        url: 'https://reqres.in/#support-heading',
        text: 'To keep ReqRes free, contributions towards server costs are appreciated!',
      },
    };

    const MOCK_USER_ID: number = MOCK_USER_RESPONSE.data.id;
    const MOCK_AVATAR_DATA = 'randomData';
    const MOCK_AVATAR_BUFFER = Buffer.from(MOCK_AVATAR_DATA);
    const AVATAR_URL: string = MOCK_USER_RESPONSE.data.avatar;

    // Mocks
    const getUserByIdMock = jest.spyOn(userService, 'getUserById');
    getUserByIdMock.mockResolvedValueOnce(MOCK_USER_RESPONSE);
    httpService.get = jest.fn().mockReturnValue(of({ data: MOCK_AVATAR_DATA }));

    const AVATAR_BUFFER_RESULT =
      await userService.fetchAvatarByUserId(MOCK_USER_ID);

    // Assertions
    expect(getUserByIdMock).toHaveBeenCalledTimes(1);
    expect(httpService.get).toHaveBeenCalledTimes(1);
    expect(AVATAR_BUFFER_RESULT).toEqual(MOCK_AVATAR_BUFFER);
    expect(getUserByIdMock).toHaveBeenCalledWith(MOCK_USER_ID);
    expect(httpService.get).toHaveBeenCalledWith(AVATAR_URL, {
      responseType: 'arraybuffer',
    });
  });

  it('should save an avatar', async () => {
    const USER_ID: number = 1;
    const AVATAR_BUFFER = Buffer.from('your_avatar_data_here');
    const EXPECTED_CREATED_AVATAR = new Avatar(
      USER_ID,
      calculateBufferHash(AVATAR_BUFFER),
      `${USER_ID}_${EXPECTED_UUID}.jpg`,
    );
    const AVATAR_PATH = path.join(
      AVATARS_DIR,
      EXPECTED_CREATED_AVATAR.filename,
    );

    // Mocks
    jest
      .spyOn(avatarModel, 'create')
      .mockResolvedValueOnce(Promise.resolve(EXPECTED_CREATED_AVATAR) as any);
    const writeFileSpy = jest.spyOn(fsPromises, 'writeFile');

    const CREATED_AVATAR = await userService.saveAvatar(USER_ID, AVATAR_BUFFER);

    // Assertions
    expect(avatarModel.create).toHaveBeenCalledTimes(1);
    expect(writeFileSpy).toHaveBeenCalledTimes(1);
    expect(avatarModel.create).toHaveBeenCalledWith(EXPECTED_CREATED_AVATAR);
    expect(CREATED_AVATAR).toEqual(EXPECTED_CREATED_AVATAR);
    expect(writeFileSpy).toHaveBeenCalledWith(AVATAR_PATH, AVATAR_BUFFER);
  });

  it('should retreive avatar by user ID from filesystem if found in database', async () => {
    const USER_ID: number = 1;
    const EXPECTED_AVATAR_BUFFER = Buffer.from('your_avatar_data_here');
    const GENERATED_UUID = uuidv4();
    const EXPECTED_RETREIVED_AVATAR = new Avatar(
      USER_ID,
      calculateBufferHash(EXPECTED_AVATAR_BUFFER),
      `${USER_ID}_${GENERATED_UUID}.jpg`,
    );
    const AVATAR_PATH = path.join(
      AVATARS_DIR,
      EXPECTED_RETREIVED_AVATAR.filename,
    );

    // Mocks
    jest
      .spyOn(avatarModel, 'findOne')
      .mockResolvedValueOnce(Promise.resolve(EXPECTED_RETREIVED_AVATAR) as any);
    jest
      .spyOn(fs, 'readFileSync')
      .mockReturnValue(EXPECTED_AVATAR_BUFFER as any);
    const fetchAvatarByUserIdMock = jest.spyOn(
      userService,
      'fetchAvatarByUserId',
    );
    const saveAvatarMock = jest.spyOn(userService, 'saveAvatar');

    const result = await userService.getAvatarByUserId(USER_ID);

    // Assertions
    expect(avatarModel.findOne).toHaveBeenCalledTimes(1);
    expect(fs.readFileSync).toHaveBeenCalledTimes(1);
    expect(result).toEqual(EXPECTED_AVATAR_BUFFER);
    expect(avatarModel.findOne).toHaveBeenCalledWith({ userId: USER_ID });
    expect(fs.readFileSync).toHaveBeenCalledWith(AVATAR_PATH);

    // Negative assertions
    expect(fetchAvatarByUserIdMock).toHaveBeenCalledTimes(0);
    expect(saveAvatarMock).toHaveBeenCalledTimes(0);
  });

  it('should retreive avatar by user ID from ReqRes API if not found in database', async () => {
    const USER_ID: number = 1;
    const EXPECTED_AVATAR_BUFFER = Buffer.from('your_avatar_data_here');

    // Mocks
    const findOneMock = jest
      .spyOn(avatarModel, 'findOne')
      .mockResolvedValue(undefined);
    const fetchAvatarByUserIdMock = jest
      .spyOn(userService, 'fetchAvatarByUserId')
      .mockResolvedValueOnce(Promise.resolve(EXPECTED_AVATAR_BUFFER));
    const saveAvatarMock = jest.spyOn(userService, 'saveAvatar');

    const result = await userService.getAvatarByUserId(USER_ID);

    // Assertions
    expect(findOneMock).toHaveBeenCalledTimes(1);
    expect(fetchAvatarByUserIdMock).toHaveBeenCalledTimes(1);
    expect(saveAvatarMock).toHaveBeenCalledTimes(1);

    expect(result).toEqual(EXPECTED_AVATAR_BUFFER);
    expect(findOneMock).toHaveBeenCalledWith({ userId: USER_ID });
    expect(saveAvatarMock).toHaveBeenCalledWith(
      USER_ID,
      EXPECTED_AVATAR_BUFFER,
    );

    // Negative assertions
    // expect(fs.readFileSync).toHaveBeenCalledTimes(0);
  });

  it('should retreive avatar by user ID from ReqRes API if not found in database', async () => {
    const USER_ID = 1;
    const FOUND_AVATAR_FILES_ARRAY = [
      '1_db35bb47-3eef-4cab-8737-36e833066199.jpg',
      '1_db35bb47-3eef-4cab-8737-36e833066192.jpg',
    ];

    // Mocks
    const deleteOneSpy = jest
      .spyOn(avatarModel, 'deleteMany')
      .mockResolvedValue({ acknowledged: true } as any);

    const readdirSpy = jest
      .spyOn(fsPromises, 'readdir')
      .mockResolvedValue(FOUND_AVATAR_FILES_ARRAY as any);
    const unlinkSpy = jest.spyOn(fsPromises, 'unlink');

    await userService.deleteAvatarById(USER_ID);

    // Assertions
    expect(deleteOneSpy).toHaveBeenCalledTimes(1);
    expect(readdirSpy).toHaveBeenCalledWith(AVATARS_DIR);
    expect(unlinkSpy).toHaveBeenCalledTimes(2);
  });
});

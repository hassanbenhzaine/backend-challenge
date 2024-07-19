import { HttpService } from '@nestjs/axios';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../../../src/controller/user.controller';
import { ReqResUserDto } from '../../../src/dto/reqres/reqres-user.dto';
import { UserDto } from '../../../src/dto/user.dto';
import { UserMapper } from '../../../src/mapper/user.mapper';
import { User } from '../../../src/schema/user.schema';
import { EmailService } from '../../../src/service/email.service';
import { EventService } from '../../../src/service/event.service';
import { UserService } from '../../../src/service/user.service';

describe('UserController', () => {
  let userController: UserController;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
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
    userController = module.get<UserController>(UserController);
  });

  it('should create a new user', async () => {
    const userDto: UserDto = new UserDto();
    userDto.setEmail('name@example.com');
    userDto.setId(1);
    userDto.setJob('SWE');
    userDto.setName('Olivier');

    const user: User = new User();
    user.setEmail('name@example.com');
    user.setId(1);
    user.setJob('SWE');
    user.setName('Olivier');

    const createSpy = jest.spyOn(userService, 'create').mockResolvedValue(user);
    const mapUserDtoToEntitySpy = jest
      .spyOn(UserMapper, 'mapUserDtoToEntity')
      .mockReturnValue(user);
    const mapEntityToUserDtoSpy = jest
      .spyOn(UserMapper, 'mapEntityToUserDto')
      .mockReturnValue(userDto);

    const result = await userController.createUser(userDto);

    expect(result).toEqual(userDto);
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(mapUserDtoToEntitySpy).toHaveBeenCalledTimes(1);
    expect(mapEntityToUserDtoSpy).toHaveBeenCalledTimes(1);
  });

  it('should retreive user by user ID', async () => {
    const expectedReqResUserDto: ReqResUserDto = {
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

    const getUserByIdSpy = jest
      .spyOn(userService, 'getUserById')
      .mockResolvedValue(expectedReqResUserDto);

    const result = await userController.getUserById(
      expectedReqResUserDto.data.id,
    );

    expect(result).toEqual(expectedReqResUserDto);
    expect(getUserByIdSpy).toHaveBeenCalledTimes(1);
  });

  it('should retreive avatar by user ID', async () => {
    const USER_ID = 1;
    const EXPECTED_AVATAR_DATA = 'randomData';
    const ExPECTED_AVATAR_BUFFER = Buffer.from(EXPECTED_AVATAR_DATA);

    const getAvatarByUserIdSpy = jest
      .spyOn(userService, 'getAvatarByUserId')
      .mockResolvedValue(ExPECTED_AVATAR_BUFFER);

    const result = await userController.getAvatarByUserId(USER_ID);

    expect(result).toEqual(ExPECTED_AVATAR_BUFFER.toString('base64'));
    expect(getAvatarByUserIdSpy).toHaveBeenCalledTimes(1);
  });

  it('should delete avatar by user ID', async () => {
    const USER_ID = 1;

    const deleteAvatarByIdSpy = jest.spyOn(userService, 'deleteAvatarById');

    await userController.deleteAvatarById(USER_ID);

    expect(deleteAvatarByIdSpy).toHaveBeenCalledTimes(1);
  });
});

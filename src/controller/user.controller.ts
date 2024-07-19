import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { UserService } from '../service/user.service';
import { UserDto } from '../dto/user.dto';
import { UserMapper } from '../mapper/user.mapper';
import { ReqResUserDto } from '../dto/reqres/reqres-user.dto';

@Controller('api/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  createUser(@Body() userDto: UserDto): Promise<UserDto> {
    const userModel = UserMapper.mapUserDtoToEntity(userDto);

    return this.userService
      .create(userModel)
      .then((user) => UserMapper.mapEntityToUserDto(user));
  }

  @Get(':userId')
  getUserById(@Param('userId') userId: number): Promise<ReqResUserDto> {
    return this.userService.getUserById(userId);
  }

  @Get(':userId/avatar')
  async getAvatarByUserId(@Param('userId') userId: number): Promise<string> {
    return (await this.userService.getAvatarByUserId(userId)).toString(
      'base64',
    );
  }

  @Delete(':userId/avatar')
  async deleteAvatarById(@Param('userId') userId: number): Promise<undefined> {
    await this.userService.deleteAvatarById(userId);
  }
}

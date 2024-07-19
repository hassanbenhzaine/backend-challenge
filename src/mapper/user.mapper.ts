import { UserDto } from '../dto/user.dto';
import { User } from '../schema/user.schema';

export class UserMapper {
  static mapUserDtoToEntity(userDto: UserDto): User {
    const user = new User();
    user.setId(userDto.id);
    user.setName(userDto.name);
    user.setJob(userDto.job);
    user.setEmail(userDto.email);
    return user;
  }

  static mapEntityToUserDto(user: User): UserDto {
    const userDto = new UserDto();
    userDto.id = user.id;
    userDto.name = user.name;
    userDto.job = user.job;
    userDto.email = user.email;
    return userDto;
  }
}

export class ReqResUserDto {
  data: ReqResUserDtoData;
  support: ReqResUserDtoSupport;
}

class ReqResUserDtoData {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  avatar: string;
}

class ReqResUserDtoSupport {
  url: string;
  text: string;
}

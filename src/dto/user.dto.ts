export class UserDto {
  id: number;
  name: string;
  job: string;
  email: string;

  public setId(id: number) {
    this.id = id;
  }

  setName(name: string) {
    this.name = name;
  }

  setJob(job: string) {
    this.job = job;
  }

  setEmail(email: string) {
    this.email = email;
  }
}

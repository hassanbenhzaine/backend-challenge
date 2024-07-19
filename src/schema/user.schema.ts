import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  _id: number;

  @Prop()
  id: number;

  @Prop()
  name: string;

  @Prop()
  job: string;

  @Prop()
  email: string;

  set_Id(_id: number) {
    this._id = _id;
  }

  setId(id: number) {
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

export const UserSchema = SchemaFactory.createForClass(User);

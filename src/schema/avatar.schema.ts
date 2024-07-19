import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AvatarDocument = Avatar & Document;

@Schema()
export class Avatar {
  @Prop()
  userId: number;

  @Prop()
  hash: string;

  @Prop()
  filename: string;

  public constructor(userId: number, hash: string, filename: string) {
    this.userId = userId;
    this.hash = hash;
    this.filename = filename;
  }
}

export const AvatarSchema = SchemaFactory.createForClass(Avatar);

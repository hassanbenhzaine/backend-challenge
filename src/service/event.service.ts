import { Injectable } from '@nestjs/common';

@Injectable()
export class EventService {
  async sendDummyEvent(message: object, queueName: string): Promise<void> {
    console.log(`Sending message to queue "${queueName}": ${message}`);
  }
}

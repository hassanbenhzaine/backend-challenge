import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  async sendDummyEmail(
    to: string,
    subject: string,
    content: string,
  ): Promise<void> {
    console.log(`Dummy email sent to ${to}: ${subject}, Content: ${content}`);
  }
}

import { Injectable } from '@nestjs/common';
import { adapter, PrismaClient } from '@repo/shared';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    super({ adapter });
  }
}

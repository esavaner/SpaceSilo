import { Injectable } from '@nestjs/common';
import { adapter, PrismaClient } from '@repo/shared/prisma';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    super({ adapter });
  }
}

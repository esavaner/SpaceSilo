import { Injectable } from '@nestjs/common';
import { UsersService } from '@/services/users.service';
import { JwtService } from '@nestjs/jwt';
import {
  AuthResponse,
  LoginRequest,
  RefreshRequest,
  RefreshResponse,
  RegisterRequest,
  SessionResponse,
  TokenClaims,
  TokenPayload,
  type UserResponse,
} from '@repo/shared';
import { compare } from 'bcrypt';
import { createHash, randomUUID } from 'node:crypto';
import { Err } from '@/common/api-message';
import { PrismaService } from '@/common/prisma.service';

const REFRESH_LIFETIME_SECONDS = 30 * 24 * 60 * 60;

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService
  ) {}

  private signTokens({ email, sub, role }: TokenClaims, sid: string, now: Date) {
    const claims = { email, sub, role, sid, iat: Math.floor(now.getTime() / 1000) };

    return {
      accessToken: this.jwtService.sign({ ...claims, typ: 'access' }, { expiresIn: '30m' }),
      refreshToken: this.jwtService.sign(
        { ...claims, typ: 'refresh', jti: randomUUID() },
        { expiresIn: REFRESH_LIFETIME_SECONDS }
      ),
    };
  }

  private expiresAt(now: Date) {
    return new Date((Math.floor(now.getTime() / 1000) + REFRESH_LIFETIME_SECONDS) * 1000);
  }

  private async createSession(
    { password: _password, ...user }: UserResponse & { password?: string },
    deviceLabel?: string
  ): Promise<AuthResponse> {
    const id = randomUUID();
    const now = new Date();
    const tokens = this.signTokens({ email: user.email, sub: user.id, role: user.role }, id, now);
    await this.prisma.session.create({
      data: {
        id,
        userId: user.id,
        tokenHash: hashToken(tokens.refreshToken),
        deviceLabel: deviceLabel?.trim().slice(0, 200) || null,
        lastUsedAt: now,
        expiresAt: this.expiresAt(now),
      },
    });
    return { ...tokens, user };
  }

  async login(loginDto: LoginRequest, deviceLabel?: string): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user || !(await compare(loginDto.password, user.password))) {
      throw Err.Unauthorized('api.auth.invalidCredentials');
    }

    return this.createSession(user, deviceLabel);
  }

  async register(registerDto: RegisterRequest, deviceLabel?: string): Promise<AuthResponse> {
    const user = await this.usersService.create(registerDto);

    return this.createSession(user, deviceLabel);
  }

  async refresh(dto: RefreshRequest): Promise<RefreshResponse> {
    let payload: TokenPayload;
    try {
      payload = this.jwtService.verify<TokenPayload>(dto.refreshToken, { ignoreExpiration: true });
    } catch {
      throw Err.Unauthorized('api.auth.invalidRefreshToken');
    }

    if (
      payload.typ !== 'refresh' ||
      typeof payload.sid !== 'string' ||
      typeof payload.sub !== 'string' ||
      typeof payload.exp !== 'number'
    ) {
      throw Err.Unauthorized('api.auth.invalidRefreshToken');
    }

    const session = await this.prisma.session.findUnique({
      where: { id: payload.sid },
      include: { user: true },
    });
    if (!session || session.userId !== payload.sub || session.user.deletedAt) {
      throw Err.Unauthorized('api.auth.invalidRefreshToken');
    }

    const tokenHash = hashToken(dto.refreshToken);
    if (session.tokenHash !== tokenHash) {
      await this.prisma.session.deleteMany({ where: { id: session.id, userId: payload.sub } });
      throw Err.Unauthorized('api.auth.invalidRefreshToken');
    }

    const now = new Date();
    if (session.expiresAt <= now || payload.exp <= Math.floor(now.getTime() / 1000)) {
      throw Err.Unauthorized('api.auth.invalidRefreshToken');
    }

    const { password: _password, ...user } = session.user;
    const tokens = this.signTokens({ email: user.email, sub: user.id, role: user.role }, session.id, now);
    const updated = await this.prisma.session.updateMany({
      where: { id: session.id, userId: user.id, tokenHash, expiresAt: { gt: now } },
      data: { tokenHash: hashToken(tokens.refreshToken), lastUsedAt: now, expiresAt: this.expiresAt(now) },
    });

    if (updated.count !== 1) {
      const current = await this.prisma.session.findUnique({ where: { id: session.id } });
      if (current && current.userId === user.id && current.tokenHash !== tokenHash) {
        await this.prisma.session.deleteMany({ where: { id: session.id, userId: user.id } });
      }
      throw Err.Unauthorized('api.auth.invalidRefreshToken');
    }

    return { ...tokens, user };
  }

  async listSessions(user: TokenPayload): Promise<SessionResponse[]> {
    const sessions = await this.prisma.session.findMany({
      where: { userId: user.sub, expiresAt: { gt: new Date() } },
      orderBy: { lastUsedAt: 'desc' },
      select: { id: true, deviceLabel: true, createdAt: true, lastUsedAt: true, expiresAt: true },
    });
    return sessions.map((session) => ({ ...session, isCurrent: session.id === user.sid }));
  }

  async revokeSession(id: string, user: TokenPayload) {
    const result = await this.prisma.session.deleteMany({ where: { id, userId: user.sub } });
    if (result.count !== 1) {
      throw Err.NotFound('api.auth.sessionNotFound');
    }
  }

  async logout(user: TokenPayload) {
    await this.prisma.session.deleteMany({ where: { id: user.sid, userId: user.sub } });
  }
}

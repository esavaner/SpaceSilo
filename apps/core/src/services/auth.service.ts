import { Injectable } from '@nestjs/common';
import { UsersService } from '@/services/users.service';
import { JwtService } from '@nestjs/jwt';
import {
  AuthResponse,
  LoginRequest,
  RefreshRequest,
  RefreshResponse,
  RegisterRequest,
  TokenClaims,
  TokenPayload,
} from '@repo/shared';
import { compare, genSalt, hash } from 'bcrypt';
import { Err } from '@/common/api-message';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
  ) {}

  private signTokens({ email, sub, role }: TokenClaims): RefreshResponse {
    const claims = { email, sub, role };

    return {
      accessToken: this.jwtService.sign({ ...claims, typ: 'access' }, { expiresIn: '30m' }),
      refreshToken: this.jwtService.sign({ ...claims, typ: 'refresh' }, { expiresIn: '365d' }),
    };
  }

  private toAuthResponse({ password: _password, ...user }: Awaited<ReturnType<UsersService['create']>>): AuthResponse {
    return { ...this.signTokens({ email: user.email, sub: user.id, role: user.role }), user };
  }

  async login(loginDto: LoginRequest): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user || !(await compare(loginDto.password, user.password))) {
      throw Err.Unauthorized('api.auth.invalidCredentials');
    }

    return this.toAuthResponse(user);
  }

  async register(registerDto: RegisterRequest): Promise<AuthResponse> {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw Err.Conflict('api.auth.userAlreadyExists');
    }
    const salt = await genSalt();
    const hashedPassword = await hash(registerDto.password, salt);
    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
      role: 'user',
    });

    return this.toAuthResponse(user);
  }

  async refresh(dto: RefreshRequest): Promise<RefreshResponse> {
    let payload: TokenPayload;
    try {
      payload = this.jwtService.verify<TokenPayload>(dto.refreshToken);
    } catch {
      throw Err.Unauthorized('api.auth.invalidRefreshToken');
    }

    if (payload.typ !== 'refresh') {
      throw Err.Unauthorized('api.auth.invalidRefreshToken');
    }

    return this.signTokens(payload);
  }
}

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
  type UserResponse,
} from '@repo/shared';
import { compare } from 'bcrypt';
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

  private toAuthResponse({ password: _password, ...user }: UserResponse & { password?: string }): AuthResponse {
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
    const user = await this.usersService.create(registerDto);

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

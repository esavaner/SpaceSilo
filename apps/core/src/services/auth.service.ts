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

  private signAccessToken(payload: TokenClaims) {
    return this.jwtService.sign(
      {
        ...payload,
        typ: 'access',
      },
      {
        expiresIn: '30m',
      }
    );
  }

  private signRefreshToken(payload: TokenClaims) {
    return this.jwtService.sign(
      {
        ...payload,
        typ: 'refresh',
      },
      {
        expiresIn: '30d',
      }
    );
  }

  async login(loginDto: LoginRequest): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw Err.Unauthorized('api.auth.invalidCredentials');
    }
    const isEqual = await compare(loginDto.password, user.password);
    if (!isEqual) {
      throw Err.Unauthorized('api.auth.invalidCredentials');
    }

    const payload: TokenClaims = {
      email: user.email,
      sub: user.id,
      role: user.role,
    };
    const { password: _password, ...userWithoutPassword } = user;
    return {
      accessToken: this.signAccessToken(payload),
      refreshToken: this.signRefreshToken(payload),
      user: userWithoutPassword,
    };
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

    const payload: TokenClaims = {
      email: user.email,
      sub: user.id,
      role: user.role,
    };

    const { password: _password, ...userWithoutPassword } = user;
    return {
      accessToken: this.signAccessToken(payload),
      refreshToken: this.signRefreshToken(payload),
      user: userWithoutPassword,
    };
  }

  async refresh(dto: RefreshRequest): Promise<RefreshResponse> {
    try {
      const payload = this.jwtService.verify<TokenPayload>(dto.refreshToken);

      if (payload.typ !== 'refresh') {
        throw Err.Unauthorized('api.auth.invalidRefreshToken');
      }

      const nextPayload: TokenClaims = {
        email: payload.email,
        sub: payload.sub,
        role: payload.role,
      };

      return {
        accessToken: this.signAccessToken(nextPayload),
        refreshToken: this.signRefreshToken(nextPayload),
      };
    } catch {
      throw Err.Unauthorized('api.auth.invalidRefreshToken');
    }
  }
}

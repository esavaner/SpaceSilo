import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
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
      throw new UnauthorizedException('User does not exists');
    }
    const isEqual = await compare(loginDto.password, user.password);
    if (!isEqual) {
      throw new UnauthorizedException('Password does not match');
    }

    const payload: TokenClaims = {
      email: user.email,
      sub: user.id,
      role: user.role,
    };
    const { password: _password, ...userWithoutPassword } = user;
    return {
      access_token: this.signAccessToken(payload),
      refresh_token: this.signRefreshToken(payload),
      user: userWithoutPassword,
    };
  }

  async register(registerDto: RegisterRequest): Promise<AuthResponse> {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User already exists');
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
      access_token: this.signAccessToken(payload),
      refresh_token: this.signRefreshToken(payload),
      user: userWithoutPassword,
    };
  }

  async refresh(dto: RefreshRequest): Promise<RefreshResponse> {
    try {
      const payload = this.jwtService.verify<TokenPayload>(dto.refresh_token);

      if (payload.typ !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const nextPayload: TokenClaims = {
        email: payload.email,
        sub: payload.sub,
        role: payload.role,
      };

      return {
        access_token: this.signAccessToken(nextPayload),
        refresh_token: this.signRefreshToken(nextPayload),
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}

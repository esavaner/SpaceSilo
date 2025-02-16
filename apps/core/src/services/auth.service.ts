import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/services/users.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from 'src/_dto/login.dto';
import { RegisterDto } from 'src/_dto/register.dto';
import { compare, genSalt, hash } from 'bcrypt';
import { TokenPayload } from 'src/common/types';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('User does not exists');
    }
    const isEqual = await compare(loginDto.password, user.password);
    if (!isEqual) {
      throw new UnauthorizedException('Password does not match');
    }

    const payload: TokenPayload = {
      email: user.email,
      sub: user.id,
      role: user.role,
    };
    const { password, ...userWithoutPassword } = user;
    return {
      access_token: this.jwtService.sign(payload),
      user: userWithoutPassword,
    };
  }

  async register(registerDto: RegisterDto) {
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

    const payload: TokenPayload = {
      email: user.email,
      sub: user.id,
      role: user.role,
    };

    const { password, ...userWithoutPassword } = user;
    return {
      access_token: this.jwtService.sign(payload),
      user: userWithoutPassword,
    };
  }
}

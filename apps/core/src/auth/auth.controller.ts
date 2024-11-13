import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from '../_dto/login.dto';
import { Response } from 'express';
import { Auth, AuthType } from './decorators/auth.decorator';
import { RegisterDto } from '../_dto/register.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Auth(AuthType.None)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    const result = await this.authService.login(loginDto);
    res.cookie('jwt', result.access_token, {
      httpOnly: true,
      // secure: true,
      sameSite: true,
    });
    return res.status(HttpStatus.OK).json(result);
  }

  @Post('logout')
  async logout(@Res() res: Response) {
    res.clearCookie('jwt');
    return res.status(HttpStatus.OK).json({ message: 'Logged out' });
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Res() res: Response) {
    const result = await this.authService.register(registerDto);
    res.cookie('jwt', result.access_token, {
      httpOnly: true,
      // secure: true,
      sameSite: true,
    });
    return res.status(HttpStatus.CREATED).json(result);
  }
}

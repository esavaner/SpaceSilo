import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { LoginDto } from 'src/_dto/login.dto';
import { Response } from 'express';
import { Auth, AuthType } from 'src/decorators/auth.decorator';
import { RegisterDto } from 'src/_dto/register.dto';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from 'src/services/auth.service';
import { SearchUserDto } from 'src/_dto/user.dto';

@ApiTags('auth')
@Auth(AuthType.None)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOkResponse({ type: SearchUserDto })
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    const result = await this.authService.login(loginDto);
    res.cookie('jwt', result.access_token, {
      httpOnly: true, //@TODO
      // secure: true,
      // sameSite: true,
    });
    return res.status(HttpStatus.OK).json(result.user);
  }

  @Post('logout')
  async logout(@Res() res: Response) {
    res.clearCookie('jwt');
    return res.status(HttpStatus.OK).json({ message: 'Logged out' });
  }

  @Post('register')
  @ApiOkResponse({ type: SearchUserDto })
  async register(@Body() registerDto: RegisterDto, @Res() res: Response) {
    const result = await this.authService.register(registerDto);
    res.cookie('jwt', result.access_token, {
      httpOnly: true, // @TODO
      // secure: true,
      // sameSite: true,
    });
    return res.status(HttpStatus.CREATED).json(result.user);
  }
}

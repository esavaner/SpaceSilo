import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { LoginRequest, RefreshRequest, RegisterRequest } from '@repo/shared';
import { Auth, AuthType } from '@/decorators/auth.decorator';
import { AuthService } from '@/services/auth.service';

@Auth(AuthType.None)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginRequest) {
    const result = await this.authService.login(loginDto);
    return result;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshRequest) {
    const result = await this.authService.refresh(dto);
    return result;
  }

  @Post('register')
  async register(@Body() registerDto: RegisterRequest) {
    const result = await this.authService.register(registerDto);
    return result;
  }
}

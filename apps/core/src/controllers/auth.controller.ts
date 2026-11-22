import { Body, Controller, Delete, Get, Headers, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { LoginRequest, RefreshRequest, RegisterRequest, type TokenPayload } from '@repo/shared';
import { Auth, AuthType } from '@/decorators/auth.decorator';
import { User } from '@/decorators/user.decorator';
import { AuthService } from '@/services/auth.service';

@Auth(AuthType.None)
@UseGuards(ThrottlerGuard)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginRequest, @Headers('user-agent') deviceLabel?: string) {
    const result = await this.authService.login(loginDto, deviceLabel);
    return result;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshRequest) {
    const result = await this.authService.refresh(dto);
    return result;
  }

  @Post('register')
  async register(@Body() registerDto: RegisterRequest, @Headers('user-agent') deviceLabel?: string) {
    const result = await this.authService.register(registerDto, deviceLabel);
    return result;
  }

  @Auth(AuthType.Bearer)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@User() user: TokenPayload) {
    await this.authService.logout(user);
  }

  @Auth(AuthType.Bearer)
  @Get('sessions')
  async sessions(@User() user: TokenPayload) {
    return this.authService.listSessions(user);
  }

  @Auth(AuthType.Bearer)
  @Delete('sessions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeSession(@Param('id') id: string, @User() user: TokenPayload) {
    await this.authService.revokeSession(id, user);
  }
}

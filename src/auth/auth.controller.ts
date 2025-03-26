import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

import { BasicToken } from './decorator/basic-token.decorator';
import { Public } from './decorator/public.decorator';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VerifyKakaoTokenDto } from './dto/verify-kakao-token.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  registerUser(@BasicToken() token: string) {
    return this.authService.register(token);
  }

  @Public()
  @Post('login')
  login(@BasicToken() token: string) {
    return this.authService.login(token);
  }

  @Public()
  @Post('refresh-token')
  refreshAccessToken(@Body() { refreshToken }: RefreshTokenDto) {
    return this.authService.refreshAccessToken(refreshToken);
  }

  @Public()
  @Post('kakao-login')
  async veriyKakaoToken(@Body() { accessToken }: VerifyKakaoTokenDto) {
    return this.authService.verifyKakaoToken(accessToken);
  }
}

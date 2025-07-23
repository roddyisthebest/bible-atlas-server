import { Controller, Post, Body, Delete } from '@nestjs/common';
import { AuthService } from './auth.service';

import { BasicToken } from './decorator/basic-token.decorator';
import { Public } from './decorator/public.decorator';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VerifyKakaoTokenDto } from './dto/verify-kakao-token.dto';
import { VerifyGoogleTokenDto } from './dto/verify-google-token.dto';
import { VerifyAppleTokenDto } from './dto/verify-apple-token.dto';
import { UserId } from 'src/common/decorator/user-id.decorator';

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

  @Public()
  @Post('google-login')
  async verifyGoogkeToken(@Body() { idToken }: VerifyGoogleTokenDto) {
    return this.authService.verifyGoogleToken(idToken);
  }

  @Public()
  @Post('apple-login')
  async verifyAppleToken(@Body() { idToken }: VerifyAppleTokenDto) {
    return this.authService.verifyAppleToken(idToken);
  }

  @Delete('withdraw')
  async withdraw(@UserId() userId: number) {
    return this.authService.withdraw(userId);
  }
}

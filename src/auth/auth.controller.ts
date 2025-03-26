import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { BasicToken } from './decorator/basic-token.decorator';
import { Public } from './decorator/public.decorator';
import { RefreshTokenDto } from './dto/refresh-token.dto';

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
}

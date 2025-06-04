import {
  BadRequestException,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { envVariables } from 'src/common/const/env.const';
@Injectable()
export class AttatchUserWithNoErrorMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      next();
      return;
    }

    const token = this.validateBearerToken(authHeader);

    try {
      const decodedPayload = this.jwtService.decode(token);

      if (decodedPayload.type !== 'access') {
        next();
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>(envVariables.accessTokenSecret),
      });

      // @ts-ignore
      req.user = payload;
      next();
    } catch (e) {
      next();
    }
  }

  validateBearerToken(rawToken: string) {
    const basicSplit = rawToken.split(' ');

    if (basicSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못됐습니다!');
    }

    const [bearer, token] = basicSplit;
    if (bearer.toLocaleLowerCase() !== 'bearer') {
      throw new BadRequestException('토큰 포맷이 잘못됐습니다!');
    }

    return token;
  }
}

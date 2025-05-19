import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Role, User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { envVariables } from 'src/common/const/env.const';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly httpService: HttpService,
  ) {}

  async authenticate(email: string, password: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new BadRequestException('잘못된 로그인 정보입니다.');
    }

    const isPass = await bcrypt.compare(password, user.password);

    if (!isPass) {
      throw new BadRequestException('잘못된 로그인 정보입니다.');
    }

    return user;
  }

  parseBasicToken(rawToken: string) {
    const basicSplit = rawToken.split(' ');
    if (basicSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못됐습니다!');
    }

    const [basic, token] = basicSplit;

    if (basic.toLocaleLowerCase() !== 'basic') {
      throw new BadRequestException('토큰 포맷이 잘못됐습니다!');
    }

    const decoded = Buffer.from(token, 'base64').toString('utf-8');

    const tokenSplit = decoded.split(':');

    if (tokenSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못됐습니다!');
    }

    const [email, password] = tokenSplit;

    return { email, password };
  }

  async issueToken(user: { id: number; role: Role }, isRefreshToken: boolean) {
    const refreshTokenSecret = this.configService.get<string>(
      envVariables.refreshTokenSecret,
    );

    const accessTokenSecret = this.configService.get<string>(
      envVariables.accessTokenSecret,
    );

    const token = await this.jwtService.signAsync(
      {
        sub: user.id,
        role: user.role,
        type: isRefreshToken ? 'refresh' : 'access',
      },
      {
        secret: isRefreshToken ? refreshTokenSecret : accessTokenSecret,
        expiresIn: isRefreshToken ? '24h' : '1h',
      },
    );

    return token;
  }

  async login(rawToken: string) {
    const { email, password } = this.parseBasicToken(rawToken);

    const user = await this.authenticate(email, password);

    const refreshToken = await this.issueToken(user, true);
    const accessToken = await this.issueToken(user, false);

    return {
      user,
      authData: {
        refreshToken,
        accessToken,
      },
    };
  }

  async register(rawToken: string) {
    const { email, password } = this.parseBasicToken(rawToken);

    return this.userService.create({ email, password });
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      const payload = (await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>(envVariables.refreshTokenSecret),
      })) as {
        sub: number;
        role: Role;
        type: 'refresh';
      };

      const user = { id: payload.sub, role: payload.role };

      const accessToken = await this.issueToken(user, false);

      return { accessToken };
    } catch (e) {
      switch (e.name) {
        case 'TokenExpiredError':
          throw new UnauthorizedException('리프레시 토큰이 만료되었습니다.');
        case 'JsonWebTokenError':
          throw new UnauthorizedException('토큰의 형식이 올바르지 않습니다.');
        case 'NotBeforeError':
          throw new UnauthorizedException(
            '토큰이 아직 활성화 되지 않았습니다.',
          );
        default:
          throw new UnauthorizedException('토큰을 확인할 수 없습니다.');
      }
    }
  }

  async getKakaoUserInfo(accessToken: string) {
    try {
      const kakaoBaseUrl = this.configService.get<string>(
        envVariables.kakaoBaseUrl,
      ) as string;

      const { data } = await firstValueFrom(
        this.httpService.get(kakaoBaseUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      );
      return data;
    } catch (e) {
      throw new UnauthorizedException('카카오 토큰 인증에 실패했습니다.');
    }
  }

  async verifyKakaoToken(kakaoAccessToken: string) {
    const userInfo = await this.getKakaoUserInfo(kakaoAccessToken);
    const email: string = userInfo?.kakao_account?.email;

    if (!email) {
      throw new BadRequestException('카카오 회원의 이메일 정보가 없습니다.');
    }

    const user = await this.userService.create({ email }, true);

    const refreshToken = await this.issueToken(user, true);
    const accessToken = await this.issueToken(user, false);

    return {
      refreshToken,
      accessToken,
    };
  }
}

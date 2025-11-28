import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Provider, Role, User } from 'src/user/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { envVariables } from 'src/common/const/env.const';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as jwt from 'jsonwebtoken';
import { UserPlaceLike } from 'src/user/entities/user-place-like.entity';
import { UserPlaceSave } from 'src/user/entities/user-place-save.entity';
import { UserPlaceMemo } from 'src/user/entities/user-place-memo.entity';
import { Proposal } from 'src/proposal/entities/proposal.entity';
const jwksClient = require('jwks-rsa');

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly httpService: HttpService,
    private readonly dataSource: DataSource,
  ) {}

  async authenticate(email: string, password: string) {
    const user = await this.userRepository.findOne({
      where: { email },
      withDeleted: true,
    });

    if (!user) {
      throw new BadRequestException('Invalid login credentials.');
    }

    const isPass = await bcrypt.compare(password, user.password);

    if (!isPass) {
      throw new BadRequestException('Invalid login credentials.');
    }

    return user;
  }

  parseBasicToken(rawToken: string) {
    const basicSplit = rawToken.split(' ');
    if (basicSplit.length !== 2) {
      throw new BadRequestException('Invalid token format!');
    }

    const [basic, token] = basicSplit;

    if (basic.toLocaleLowerCase() !== 'basic') {
      throw new BadRequestException('Invalid token format!');
    }

    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const tokenSplit = decoded.split(':');

    if (tokenSplit.length !== 2) {
      throw new BadRequestException('Invalid token format!');
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
        expiresIn: isRefreshToken ? '1h' : '10m',
      },
    );

    return token;
  }

  async login(rawToken: string) {
    const { email, password } = this.parseBasicToken(rawToken);
    let user = await this.authenticate(email, password);

    let recovered = false;

    if (user.deletedAt) {
      user.deletedAt = null;
      user = await this.userRepository.save(user);
      recovered = true;
    }

    const refreshToken = await this.issueToken(user, true);
    const accessToken = await this.issueToken(user, false);

    return {
      user,
      authData: { refreshToken, accessToken },
      recovered,
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
          throw new UnauthorizedException('Refresh token has expired.');
        case 'JsonWebTokenError':
          throw new UnauthorizedException('Invalid token format.');
        case 'NotBeforeError':
          throw new UnauthorizedException(
            'Token is not yet active.',
          );
        default:
          throw new UnauthorizedException('Unable to verify token.');
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
    } catch {
      throw new UnauthorizedException('Kakao token authentication failed.');
    }
  }

  async verifyKakaoToken(kakaoAccessToken: string) {
    const userInfo = await this.getKakaoUserInfo(kakaoAccessToken);
    const email: string = userInfo?.kakao_account?.email;

    if (!email) {
      throw new BadRequestException('Kakao user email information is missing.');
    }

    const user = await this.userService.create({ email }, true);
    const refreshToken = await this.issueToken(user, true);
    const accessToken = await this.issueToken(user, false);

    return { refreshToken, accessToken };
  }

  async getGoogleUserInfo(googleIdToken: string) {
    try {
      const googleBaseUrl = this.configService.get<string>(
        envVariables.googleBaseUrl,
      ) as string;

      const response = await firstValueFrom(
        this.httpService.get(googleBaseUrl, {
          params: { id_token: googleIdToken },
        }),
      );

      const { sub, email, name, picture } = response.data;
      return { sub, email, name, picture };
    } catch {
      throw new UnauthorizedException('Google token authentication failed.');
    }
  }

  async verifyGoogleToken(googleIdToken: string) {
    const { sub, email, name, picture } =
      await this.getGoogleUserInfo(googleIdToken);

    let user = await this.userRepository.findOne({
      where: { provider: Provider.GOOGLE, providerId: sub },
      withDeleted: true,
    });

    if (!user) {
      user = this.userRepository.create({
        provider: Provider.GOOGLE,
        providerId: sub,
        email,
        name,
        avatar: picture,
      });
      user = await this.userRepository.save(user);
    }

    let recovered = false;

    if (user.deletedAt) {
      user.deletedAt = null;
      const updatedUser = await this.userRepository.save(user);

      user = updatedUser;
      recovered = true;
    }

    const refreshToken = await this.issueToken(user, true);
    const accessToken = await this.issueToken(user, false);

    return {
      user,
      authData: { refreshToken, accessToken },
      recovered,
    };
  }

  async getAppleUserInfo(appleToken: string) {
    try {
      const appleBaseUrl = this.configService.get<string>(
        envVariables.appleBaseUrl,
      ) as string;

      const appBundleId = this.configService.get<string>(
        envVariables.appBundleId,
      ) as string;

      const client = jwksClient({
        jwksUri: `${appleBaseUrl}/auth/keys`,
        cache: true,
        rateLimit: true,
      });

      const decoded = jwt.decode(appleToken, { complete: true });

      if (!decoded || typeof decoded === 'string') {
        throw new UnauthorizedException('Invalid Apple token format.');
      }

      const { kid, alg } = decoded.header;

      const key = await new Promise<string>((resolve, reject) => {
        client.getSigningKey(kid, (err, key) => {
          if (err) return reject(err);
          resolve(key?.getPublicKey() as string);
        });
      });

      const payload = jwt.verify(appleToken, key, {
        algorithms: [alg as any],
        issuer: appleBaseUrl,
        audience: appBundleId,
      }) as jwt.JwtPayload;

      return {
        sub: payload.sub,
        email: payload.email,
        name: payload.name,
      };
    } catch (e) {
      console.error('🔴 Apple Token Verification Failed:', e);
      throw new UnauthorizedException('Apple token authentication failed.');
    }
  }

  async verifyAppleToken(token: string) {
    const { sub, email, name } = await this.getAppleUserInfo(token);

    let user = await this.userRepository.findOne({
      where: { provider: Provider.APPLE, providerId: sub },
    });

    if (!user) {
      user = this.userRepository.create({
        provider: Provider.APPLE,
        providerId: sub,
        email: email ?? null,
        name: name ?? null,
      });
      user = await this.userRepository.save(user);
    }

    let recovered = false;

    if (user.deletedAt) {
      user.deletedAt = null;
      const updatedUser = await this.userRepository.save(user);

      user = updatedUser;
      recovered = true;
    }

    const refreshToken = await this.issueToken(user, true);
    const accessToken = await this.issueToken(user, false);

    return {
      user,
      authData: { refreshToken, accessToken },
      recovered,
    };
  }

  async withdraw(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found!');
    }

    await this.dataSource.transaction(async (manager) => {
      // 1. 유저 soft delete
      await manager.getRepository(User).softDelete({ id });

      // 2. 좋아요, 북마크, 메모 삭제
      await manager.getRepository(UserPlaceLike).delete({ user: { id } });
      await manager.getRepository(UserPlaceSave).delete({ user: { id } });
      await manager.getRepository(UserPlaceMemo).delete({ user: { id } });

      // // 3. 의견 익명화 처리 (예시)
      await manager
        .getRepository(Proposal)
        .update({ creator: { id } }, { creator: null as any });
    });

    return id;
  }

  delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

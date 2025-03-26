import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { envVariables } from 'src/common/const/env.const';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async create(createUserDto: CreateUserDto, isSns: boolean = false) {
    const { email, password } = createUserDto;

    const user = await this.userRepository.findOne({ where: { email } });

    if (user) {
      throw new BadRequestException('이미 가입된 계정입니다.');
    }

    if (isSns) {
      const newSnsUser = this.userRepository.create({ email });
      const newSavedSnsUser = await this.userRepository.save(newSnsUser);
      return newSavedSnsUser;
    }

    const haveNoPassword = !password;

    if (haveNoPassword) {
      throw new BadRequestException('비밀번호를 입력해주세요.');
    }

    const hash = await bcrypt.hash(
      password,
      this.configService.get<number>(envVariables.hasRounds) as number,
    );

    const newUser = this.userRepository.create({ email, password: hash });

    const savedUser = await this.userRepository.save(newUser);

    return savedUser;
  }

  findAll() {
    return this.userRepository.find();
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('존재하지 않는 사용자입니다!');
    }

    return user;
  }

  async remove(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('존재하지 않는 사용자입니다!');
    }

    await this.userRepository.delete({ id });
    return id;
  }
}

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
import { CommonService } from 'src/common/common.service';

import { Place } from 'src/place/entities/place.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Place)
    private readonly placeRepository: Repository<Place>,
    private readonly configService: ConfigService,
    private readonly commonService: CommonService,
  ) {}

  async create(createUserDto: CreateUserDto, isSns: boolean = false) {
    const { email, password } = createUserDto;

    const user = await this.userRepository.findOne({ where: { email } });

    if (user) {
      throw new BadRequestException('Account already exists.');
    }

    if (isSns) {
      const newSnsUser = this.userRepository.create({ email });
      const newSavedSnsUser = await this.userRepository.save(newSnsUser);
      return newSavedSnsUser;
    }

    const haveNoPassword = !password;

    if (haveNoPassword) {
      throw new BadRequestException('Please enter a password.');
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
      throw new NotFoundException('User not found!');
    }

    return user;
  }

  async remove(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found!');
    }

    await this.userRepository.delete({ id });
    return id;
  }
}

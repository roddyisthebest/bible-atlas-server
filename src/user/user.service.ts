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
import { UserLocationLike } from './entities/user-location-like.entity';
import { FindAllDto } from 'src/location/dto/find-all.dto';
import { UserLocationSave } from './entities/user-location-save.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly commonService: CommonService,
    @InjectRepository(UserLocationLike)
    private readonly userLocationLikeRepository: Repository<UserLocationLike>,
    @InjectRepository(UserLocationSave)
    private readonly userLocationSaveRepository: Repository<UserLocationSave>,
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

  async getMySavedLocations(
    { page, limit, query }: FindAllDto,
    userId: number,
  ) {
    const qb = this.userLocationSaveRepository
      .createQueryBuilder('uls')
      .leftJoinAndSelect('uls.user', 'user')
      .leftJoinAndSelect('uls.location', 'location')
      .where('user.id = :userId', { userId });

    if (query) {
      qb.where('location.name ILIKE :query', { query: `%${query}%` });
    }

    this.commonService.applyPagePaginationParamsToQb(qb, { limit, page });

    qb.orderBy('location.createdAt', 'DESC');

    const [data, total] = await qb.getManyAndCount();

    const filteredData = data.map((d) => d.location);

    return {
      total,
      page,
      limit,
      data: filteredData,
    };
  }

  async getMyLikedLocations(
    { page, limit, query }: FindAllDto,
    userId: number,
  ) {
    const qb = this.userLocationLikeRepository
      .createQueryBuilder('ull')
      .leftJoinAndSelect('ull.user', 'user')
      .leftJoinAndSelect('ull.location', 'location')
      .where('user.id = :userId', { userId });

    if (query) {
      qb.where('location.name ILIKE :query', { query: `%${query}%` });
    }

    this.commonService.applyPagePaginationParamsToQb(qb, { limit, page });

    qb.orderBy('location.createdAt', 'DESC');

    const [data, total] = await qb.getManyAndCount();

    const filteredData = data.map((d) => d.location);

    return {
      total,
      page,
      limit,
      data: filteredData,
    };
  }
}

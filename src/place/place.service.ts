import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as pLimit from 'p-limit';
import { Observable, Subject, map } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Place } from './entities/place.entity';
import { DataSource, In, Repository } from 'typeorm';
import { CommonService } from 'src/common/common.service';
import { PlaceType } from 'src/place-type/entities/place-type.entity';
import { PlacePlaceType } from './entities/place-place-type.entity';
import { GetPlacesDto } from './dto/get-places.dto';
import { MinimumRole } from 'src/auth/decorator/minimun-role.decorator';
import { Role } from 'src/user/entities/user.entity';
import { join } from 'path';
import { writeFile, readFile, readdir } from 'fs/promises';
import { PlaceRelation } from './entities/place-relation.entity';
import {
  AiPlaceFile,
  AiPlaceRelation,
  AiPlaceData,
} from './types/ai-place-file.type';
import { GetMyPlacesDto } from './dto/get-my-places.dto';
import { PlaceFilter } from './const/place.const';
import { UserPlaceLike } from 'src/user/entities/user-place-like.entity';
import { UserPlaceSave } from 'src/user/entities/user-place-save.entity';
import { UserPlaceMemo } from 'src/user/entities/user-place-memo.entity';
import { CreateOrUpdatePlaceMemoDto } from './dto/create-or-update-place-memo.dto';

@Injectable()
export class PlaceService {
  constructor(
    @InjectRepository(Place)
    private readonly placeRepository: Repository<Place>,
    @InjectRepository(PlaceType)
    private readonly placeTypeRepository: Repository<PlaceType>,
    @InjectRepository(UserPlaceLike)
    private readonly userPlaceLikeRepository: Repository<UserPlaceLike>,
    @InjectRepository(UserPlaceSave)
    private readonly userPlaceSaveRepository: Repository<UserPlaceSave>,
    @InjectRepository(UserPlaceMemo)
    private readonly userPlaceMemoRepository: Repository<UserPlaceMemo>,
    private readonly commonService: CommonService,
    private readonly dataSource: DataSource,
  ) {}

  private readonly baseURL = 'https://www.openbible.info';
  private readonly geoJsonBaseURL = 'https://a.openbible.info/geo/data';
  private readonly logger = new Logger(PlaceService.name);

  private progressStreams = new Map<number, Subject<{ progress: number }>>();

  async create(createPlaceDto: CreatePlaceDto) {
    const { typeIds, ...rest } = createPlaceDto;

    return await this.dataSource.transaction(async (manager) => {
      const placeTypes = await manager.find(PlaceType, {
        where: { id: In(typeIds) },
      });

      const hasInvalidIds = placeTypes.length !== typeIds.length;

      if (hasInvalidIds) {
        throw new BadRequestException(
          '유효하지 않은 PlaceType ID가 포함되어 있습니다.',
        );
      }

      const place = await manager.save(Place, { ...rest });

      const relations = placeTypes.map((pt) => {
        const ppt = new PlacePlaceType();
        ppt.place = place;
        ppt.placeType = pt;
        return ppt;
      });

      await manager.save(PlacePlaceType, relations);

      const placeWithTypes = await manager.findOne(Place, {
        where: { id: place.id },
        relations: ['types', 'types.placeType'],
      });

      return {
        ...placeWithTypes,
        types: placeWithTypes?.types.map((type) => type.placeType),
      };
    });
  }

  async findAll(getPlacesDto: GetPlacesDto) {
    const { limit, page, name, isModern, stereo, typeIds } = getPlacesDto;

    const qb = this.placeRepository
      .createQueryBuilder('place')
      .leftJoinAndSelect('place.types', 'placePlaceType')
      .leftJoinAndSelect('placePlaceType.placeType', 'placeType');

    if (name) {
      qb.andWhere('place.name ILIKE :name', { name: `%${name}%` });
    }

    if (typeof isModern === 'boolean') {
      qb.andWhere('place.isModern = :isModern', { isModern });
    }

    if (stereo) {
      qb.andWhere('place.stereo = :stereo', { stereo });
    }

    if (typeIds && typeIds.length > 0) {
      const validTypes = await this.placeTypeRepository.find({
        where: { id: In(typeIds) },
      });

      const validTypeIds = validTypes.map((pt) => pt.id);

      if (validTypeIds.length > 0) {
        qb.innerJoin('place.types', 'placePlaceType').andWhere(
          'placePlaceType.placeTypeId IN (:...validTypeIds)',
          { validTypeIds },
        );
      } else {
        // 아무 유효 ID 없으면 결과 없게끔
        qb.where('1 = 0');
      }
    }

    this.commonService.applyPagePaginationParamsToQb(qb, { limit, page });

    let [data, total] = await qb.getManyAndCount();

    return {
      total,
      page,
      limit,
      data: data.map((d) => {
        return { ...d, types: d.types.map((type) => type.placeType) };
      }),
    };
  }

  async findMyPlaces(userId: number, getMyPlacesDto: GetMyPlacesDto) {
    const { limit, page, filter } = getMyPlacesDto;

    const qb = this.placeRepository
      .createQueryBuilder('place')
      .leftJoinAndSelect('place.types', 'placePlaceType')
      .leftJoinAndSelect('placePlaceType.placeType', 'placeType');

    switch (filter) {
      case PlaceFilter.like:
        qb.innerJoin(
          'user_place_like', // 테이블 이름
          'upl',
          'upl.placeId = place.id AND upl.userId = :userId',
          { userId },
        );
        break;

      case PlaceFilter.save:
        qb.innerJoin(
          'user_place_save', // 테이블 이름
          'ups',
          'ups.placeId = place.id AND ups.userId = :userId',
          { userId },
        );

        break;

      case PlaceFilter.memo:
        qb.innerJoin(
          'user_place_memo', // 테이블 이름
          'upm',
          'upm.placeId = place.id AND upm.userId = :userId',
          { userId },
        );
        break;

      default:
        qb.where('1 = 0'); // 필터가 없으면 아무 것도 안 돌게
        break;
    }

    this.commonService.applyPagePaginationParamsToQb(qb, { limit, page });
    let [data, total] = await qb.getManyAndCount();

    return {
      total,
      page,
      limit,
      data: data.map((d) => {
        return { ...d, types: d.types.map((type) => type.placeType) };
      }),
    };
  }

  async findOne(id: string) {
    const place = await this.placeRepository.findOne({
      where: { id },
      relations: ['types', 'types.placeType'],
    });

    if (!place) {
      throw new NotFoundException('존재하지 않는 id값의 장소입니다.');
    }

    return { ...place, types: place.types.map((ppt) => ppt.placeType) };
  }

  @MinimumRole(Role.SUPER)
  async update(id: string, updatePlaceDto: UpdatePlaceDto) {
    const place = await this.placeRepository.findOne({ where: { id } });

    if (!place) {
      throw new NotFoundException('존재하지 않는 id값의 장소입니다.');
    }

    const { typeIds, ...rest } = updatePlaceDto;

    return await this.dataSource.transaction(async (manager) => {
      await manager.update(Place, { id }, { ...rest });

      if (typeIds) {
        await manager.delete(PlacePlaceType, { place: { id } });

        if (typeIds.length > 0) {
          const placeTypes = await manager.find(PlaceType, {
            where: { id: In(typeIds) },
          });

          const hasInvalidIds = placeTypes.length !== typeIds.length;

          if (hasInvalidIds) {
            throw new BadRequestException(
              '유효하지 않은 PlaceType ID가 포함되어 있습니다.',
            );
          }

          const relations = placeTypes.map((pt) => {
            const ppt = new PlacePlaceType();
            ppt.place = place;
            ppt.placeType = pt;
            return ppt;
          });

          await manager.save(PlacePlaceType, relations);
        }
      }

      const placeWithTypes = await manager.findOne(Place, {
        where: { id },
        relations: ['types', 'types.placeType'],
      });

      return {
        ...placeWithTypes,
        types: placeWithTypes?.types.map((ppt) => ppt.placeType),
      };
    });
  }

  @MinimumRole(Role.SUPER)
  async remove(id: string) {
    await this.findOne(id);

    this.placeRepository.delete({ id });

    return id;
  }

  async toggleLike(userId: number, placeId: string) {
    const place = await this.placeRepository.findOne({
      where: { id: placeId },
    });

    if (!place) {
      throw new NotFoundException('불명확한 place id 입니다.');
    }

    const isExist = await this.userPlaceLikeRepository.findOne({
      where: {
        user: userId as any,
        place: placeId as any,
      },
    });

    if (isExist) {
      await this.userPlaceLikeRepository.remove(isExist);
      return { liked: false };
    }

    const like = this.userPlaceLikeRepository.create({
      user: userId as any,
      place: placeId as any,
    });

    await this.userPlaceLikeRepository.save(like);

    return { liked: true };
  }

  async toggleSave(userId: number, placeId: string) {
    const place = await this.placeRepository.findOne({
      where: { id: placeId },
    });

    if (!place) {
      throw new NotFoundException('불명확한 place id 입니다.');
    }

    const isExist = await this.userPlaceSaveRepository.findOne({
      where: {
        user: userId as any,
        place: placeId as any,
      },
    });

    if (isExist) {
      await this.userPlaceSaveRepository.remove(isExist);
      return { saved: false };
    }

    const like = this.userPlaceSaveRepository.create({
      user: userId as any,
      place: placeId as any,
    });

    await this.userPlaceSaveRepository.save(like);

    return { saved: true };
  }

  async createOrUpdateMemo(
    userId: number,
    placeId: string,
    createOrUpdatePlaceMemoDto: CreateOrUpdatePlaceMemoDto,
  ) {
    const place = await this.placeRepository.findOne({
      where: { id: placeId },
    });

    if (!place) {
      throw new NotFoundException('불명확한 place id 입니다.');
    }

    const isExist = await this.userPlaceMemoRepository.findOne({
      where: {
        user: userId as any,
        place: placeId as any,
      },
    });

    if (isExist) {
      await this.userPlaceMemoRepository.update(isExist, {
        text: createOrUpdatePlaceMemoDto.text,
      });

      return { text: createOrUpdatePlaceMemoDto.text };
    }

    const memo = this.userPlaceMemoRepository.create({
      user: userId as any,
      place: placeId as any,
      text: createOrUpdatePlaceMemoDto.text,
    });

    await this.userPlaceMemoRepository.save(memo);

    return { text: createOrUpdatePlaceMemoDto.text };
  }

  async deleteMemo(userId: number, placeId: string) {
    const place = await this.placeRepository.findOne({
      where: { id: placeId },
    });

    if (!place) {
      throw new NotFoundException('불명확한 place id 입니다.');
    }

    const isExist = await this.userPlaceMemoRepository.findOne({
      where: {
        user: userId as any,
        place: placeId as any,
      },
    });

    if (!isExist) {
      throw new NotFoundException('memo가 존재하지 않습니다.');
    }

    await this.userPlaceMemoRepository.remove(isExist);

    return {
      memo: 'deleted',
    };
  }

  @MinimumRole(Role.SUPER)
  async scrapPlacesFromWeb(userId: number, page: number) {
    try {
      const res = await axios.get(`${this.baseURL}/geo/atlas/all`);
      const $ = cheerio.load(res.data);
      const result: any[] = [];
      const parents: any[] = [];
      const childrens: any[] = [];
      $('h2[id]').each((_, el) => {
        const h2 = $(el);
        const p = h2.next('p');
        const id = h2.attr('id');
        const name = h2.text().trim();
        const imageTag = p.find('img');
        const imageTitle = imageTag.attr('src')?.split('/')?.at(-1);

        const placeLinkTag = p.find('a').first();
        const placeUrl = placeLinkTag.attr('href');
        const isModern = placeUrl?.includes('modern');

        const rawHtml = p.html() || '';
        const descMatch = rawHtml.match(
          /Possible identifications\)<\/a>:\s*([^<]+)/,
        );
        const description = descMatch ? descMatch[1].trim() : '';

        const verses: string[] = [];
        p.find('a[href*="biblegateway"]').each((_, a) => {
          const href = $(a).attr('href');
          if (href) {
            const url = new URL(href);
            const searchParams = url.searchParams.get('search');
            if (searchParams) {
              verses.push(searchParams);
            }
          }
        });

        result.push({
          id,
          name,
          imageTitle,
          isModern,
          stereo: 'parent',
          description: '',
          koreanDescription: '',
          verses,
          placeUrl,
        });
      });

      const batchParentSize = 5;
      let doneParentCount = 0;
      const limit = 20;

      const start = page * limit;
      const end = (page + 1) * limit;

      const slicedResult = result.slice(start, end);

      const parentTotal = slicedResult.length;

      const relations: {
        parentId: string;
        childId: string | undefined;
        possibility: number | null;
      }[] = [];

      for (let i = 0; i < parentTotal; i += batchParentSize) {
        const batch = slicedResult.slice(i, i + batchParentSize);

        const promises = batch.map(async (place) => {
          const fullUrl = `${this.baseURL}${place.placeUrl}`;
          const res = await axios.get(fullUrl);
          const $ = cheerio.load(res.data);

          const identificationPaths: any[] = [];

          let unknownPlacePossibility: number | null = null;

          const types = $('tr')
            .filter(
              (_, el) =>
                $(el).find('th').text().trim() === 'Type' ||
                $(el).find('th').text().trim() === 'Types',
            )
            .find('td')
            .text()
            .trim()
            .split(/\s*or\s*/);
          const response = await axios.get(
            `${this.geoJsonBaseURL}/${place.id}.geojson`,
          );
          const geojsonObject = response.data;

          // 👉 JSON → string
          const geojsonText = JSON.stringify(geojsonObject);
          $('ol')
            .first()
            .children('li')
            .filter((_, el) => {
              const liText = $(el).text().toLowerCase(); // 소문자 비교를 위해
              return !liText.includes('another name');
            })
            .each((_, el) => {
              const liText = $(el).text().toLowerCase();

              const isUnknown = liText.includes('unknown');

              if (isUnknown) {
                const match = liText.match(/(\d+)%/);
                const rate = match ? Number(match[1]) : null;
                unknownPlacePossibility = rate;
                return;
              }

              const path = $(el).find('a').attr('href');

              if (!path) {
                return;
              }

              const isPerfect = liText.includes('very high confidence');

              const match = liText.match(/(\d+)%/);
              const possibility = match ? Number(match[1]) : null;

              const childId = path.split('/')?.at(-2);

              relations.push({
                parentId: place.id,
                childId,
                possibility: isPerfect ? 100 : possibility,
              });
              identificationPaths.push(path);
            });

          return {
            ...place,
            id: place.id,
            identificationPaths,
            types,
            unknownPlacePossibility,
            geojsonText,
          };
        });

        const detail = await Promise.all(promises); // ✅ 병렬 실행

        parents.push(...detail);

        doneParentCount += batch.length;
        const progress = Number(
          ((doneParentCount / parentTotal / 2) * 100).toFixed(1),
        );
        this.pushProgress(userId, progress); // ✅ 진행률 전송

        await this.delay(1000); // ✅ 다음 배치 전에 잠깐 딜레이
      }

      const pureIdentificationPaths: string[] = Array.from(
        new Set(parents.flatMap((d) => d.identificationPaths)),
      );

      const batchChildSize = 5;
      let doneChildCount = 0;

      // const childTotal = 50;
      const childTotal = pureIdentificationPaths.length;

      for (let i = 0; i < childTotal; i += batchChildSize) {
        const batch = pureIdentificationPaths.slice(i, i + batchChildSize);
        const promises = batch.map(async (placeUrl) => {
          const [, , period, placeId, name] = placeUrl.split('/');

          const fullUrl = `${this.baseURL}${placeUrl}`;
          const res = await axios.get(fullUrl);
          const $ = cheerio.load(res.data);
          const hasAbout = $('h2')
            .toArray()
            .some((el) => $(el).text().includes('About'));

          const types = $('tr')
            .filter(
              (_, el) =>
                $(el).find('th').text().trim() === 'Type' ||
                $(el).find('th').text().trim() === 'Types',
            )
            .find('td')
            .text()
            .trim()
            .split(/\s*or\s*/);

          if (!hasAbout) {
            return null;
          }

          const response = await axios.get(
            `${this.geoJsonBaseURL}/${placeId}.geojson`,
          );
          const geojsonObject = response.data;

          // 👉 JSON → string
          const geojsonText = JSON.stringify(geojsonObject);

          return {
            id: placeId,
            name,
            isModern: period === 'modern',
            stereo: 'child',
            description: '',
            koreanDescription: '',
            types,
            geojsonText,
          };
        });

        const detail = await Promise.all(promises); // ✅ 병렬 실행
        childrens.push(...detail);
        doneChildCount += batch.length;
        const progress =
          50 + Number(((doneChildCount / childTotal / 2) * 100).toFixed(1));
        this.pushProgress(userId, progress); // ✅ 진행률 전송

        await this.delay(1000); // ✅ 다음 배치 전에 잠깐 딜레이
      }

      const data = [...parents, ...childrens];

      const date = new Date().valueOf();

      const dir = join(process.cwd(), 'places-data');
      const path = join(dir, `${date}&page=${page}&limit=${limit}.json`);

      try {
        await writeFile(
          path,
          JSON.stringify({
            data,
            relations,
            total: data.length,
          }),
          'utf-8',
        );
      } catch (error) {
        throw new ConflictException('파일 저장 에러입니다.', error);
      }

      return {
        data,
        relations,
        total: data.length,
      };
    } catch (error) {
      this.logger.error('❌ Failed to scrap places from web', error);
      throw new ConflictException('에러!', error);
    }
  }

  @MinimumRole(Role.SUPER)
  async scrapImages(userId: number) {}

  @MinimumRole(Role.SUPER)
  async pushToDB() {
    const dir = join(process.cwd(), 'ai-places-data');
    const fileNames = await readdir(dir);

    const paths = fileNames
      .filter((file) => file.endsWith('.json')) // 확장자만 체크
      .map((file) => join(dir, file));

    let parsedUniquePlaces: Place[] = [];
    let parsedRelations: PlaceRelation[] = [];
    let parsedPlacePlaceTypes: PlacePlaceType[] = [];
    let parsedPlaceTypes: string[] = [];

    // 1. 파일 읽기 및 파싱 단계
    try {
      const files = await Promise.all(paths.map((path) => readFile(path)));
      const parsedFiles: AiPlaceFile[] = files.map((buf) =>
        JSON.parse(buf.toString()),
      );

      const parsedDatas = parsedFiles.flatMap((parse) => parse.data);
      const uniqueDatas = Array.from(
        new Map(parsedDatas.map((item) => [item.id, item])).values(),
      );

      parsedUniquePlaces = uniqueDatas.map(
        (data) =>
          ({
            id: data.id,
            name: data.name,
            isModern: data.isModern,
            description: data.description,
            koreanDescription: data.koreanDescription,
            stereo: data.stereo,
            verse: data.verses?.join(', '),
          }) as Place,
      );

      parsedPlaceTypes = uniqueDatas.flatMap((data) => data.types);

      uniqueDatas.forEach((data) => {
        const types = data.types;

        const placePlaceTypes = types.map((type) => {
          const placePlaceType = new PlacePlaceType();
          placePlaceType.place = { id: data.id } as Place;
          placePlaceType.placeType = { name: type } as PlaceType;
          return placePlaceType;
        });

        parsedPlacePlaceTypes.push(...placePlaceTypes);
      });

      parsedRelations = parsedFiles.flatMap((parse) =>
        parse.relations.map((relation) => {
          const placeRelation = new PlaceRelation();
          placeRelation.parent = { id: relation.parentId } as Place;
          placeRelation.child = { id: relation.childId } as Place;
          placeRelation.possibility = relation.possibility;
          return placeRelation;
        }),
      );
    } catch (e) {
      throw new InternalServerErrorException('📂 파일 읽기 또는 파싱 실패', {
        cause: e,
      });
    }

    // 2. DB 저장 단계
    try {
      return await this.dataSource.transaction(async (manager) => {
        await Promise.all([
          manager.delete(PlaceRelation, {}),
          manager.delete(PlacePlaceType, {}),
          manager.delete(PlaceType, {}),
          manager.delete(Place, {}),
        ]);

        await manager.save(Place, parsedUniquePlaces);
        await manager.save(PlaceRelation, parsedRelations);

        const uniquePlaceTypes = Array.from(new Set(parsedPlaceTypes)).map(
          (name) => {
            const type = new PlaceType();
            type.name = name;
            return type;
          },
        );

        const placeTypes = await manager.save(PlaceType, uniquePlaceTypes);

        const placePlaceTypes = parsedPlacePlaceTypes
          .map((placePlaceType) => {
            const placeType = placeTypes.find(
              (placeType) => placeType.name === placePlaceType.placeType.name,
            );
            if (!placeType) {
              return null;
            }

            placePlaceType.placeType = placeType;

            return placePlaceType;
          })
          .filter((placePlaceType) => !!placePlaceType);

        await manager.save(PlacePlaceType, placePlaceTypes as PlacePlaceType[]);
        return {
          status: 200,
          message: `📌 ${parsedUniquePlaces.length}개 장소와 ${parsedRelations.length}개 관계 저장 완료`,
        };
      });
    } catch (e) {
      throw new InternalServerErrorException('💾 DB 저장 중 오류 발생', {
        cause: e,
      });
    }
  }

  pushProgress(userId: number, progress: number) {
    const stream = this.progressStreams.get(userId);

    if (stream) {
      stream.next({ progress });
    }
  }

  getProgressStream(
    userId: number,
  ): Observable<{ data: { progress: number } }> | undefined {
    if (!this.progressStreams.has(userId)) {
      this.progressStreams.set(userId, new Subject());
    }

    return this.progressStreams
      .get(userId)
      ?.asObservable()
      .pipe(map((progress) => ({ data: progress })));
  }

  delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

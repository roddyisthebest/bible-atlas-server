import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
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
import {
  DataSource,
  FeatureCollection,
  ILike,
  In,
  IsNull,
  Not,
  Repository,
} from 'typeorm';
import { GeoJSON } from './types/geojson.type';
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
import { BibleBook, PlaceFilter, PlaceSort } from './const/place.const';
import { UserPlaceLike } from 'src/user/entities/user-place-like.entity';
import { UserPlaceSave } from 'src/user/entities/user-place-save.entity';
import { UserPlaceMemo } from 'src/user/entities/user-place-memo.entity';
import { CreateOrUpdatePlaceMemoDto } from './dto/create-or-update-place-memo.dto';
import { PagePaginationDto } from 'src/common/dto/page-pagination.dto';
import { GetVerseDto } from './dto/get-verse.dto';
import * as https from 'https'; // ✅ 이거 추가!

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

  private readonly bibleURL = 'https://ibibles.net/quote.php';
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
    const {
      limit,
      page,
      name,
      isModern,
      stereo,
      placeTypes,
      prefix,
      sort,
      bibleBook,
    } = getPlacesDto;

    const qb = this.placeRepository
      .createQueryBuilder('place')
      .leftJoinAndSelect('place.types', 'placePlaceType')
      .leftJoinAndSelect('placePlaceType.placeType', 'placeType');

    if (name) {
      qb.andWhere('(place.name ILIKE :name OR place.koreanName ILIKE :name)', {
        name: `%${name}%`,
      });
    }

    if (typeof isModern === 'boolean') {
      qb.andWhere('place.isModern = :isModern', { isModern });
    }

    if (stereo) {
      qb.andWhere('place.stereo = :stereo', { stereo });
    }

    if (prefix) {
      qb.andWhere(`LOWER(LEFT(place.name, 1)) = :prefix`, {
        prefix: prefix.toLowerCase(),
      });
    }

    if (bibleBook) {
      qb.andWhere(`place.verse ILIKE :bibleBook`, {
        bibleBook: `%${bibleBook}%`,
      });

      // 해당 성경의 첫 번째 구절을 찾아서 정렬
      qb.addSelect(
        `
        CASE 
          WHEN POSITION('${bibleBook}.' IN place.verse) > 0 THEN
            CAST(SPLIT_PART(SPLIT_PART(SUBSTRING(place.verse FROM POSITION('${bibleBook}.' IN place.verse)), '.', 2), ',', 1) AS INTEGER)
          ELSE 999
        END
        `,
        'chapter',
      )
        .addSelect(
          `
        CASE 
          WHEN POSITION('${bibleBook}.' IN place.verse) > 0 THEN
            CAST(SPLIT_PART(SPLIT_PART(SUBSTRING(place.verse FROM POSITION('${bibleBook}.' IN place.verse)), '.', 3), ',', 1) AS INTEGER)
          ELSE 999
        END
        `,
          'verse_num',
        )
        .orderBy('chapter', 'ASC')
        .addOrderBy('verse_num', 'ASC');
    } else if (sort) {
      if (sort === PlaceSort.like) {
        qb.andWhere('place.likeCount > 0');
        qb.orderBy('place.likeCount', 'DESC');
      } else {
        qb.orderBy('place.name', sort === PlaceSort.asc ? 'ASC' : 'DESC');
      }
    }

    if (placeTypes && placeTypes.length > 0) {
      qb.andWhere('placeType.name IN (:...placeTypes)', { placeTypes });
    }

    this.commonService.applyPagePaginationParamsToQb(qb, { limit, page });

    const [data, total] = await qb.getManyAndCount();

    const editedData = data.map((place) => ({
      ...place,
      types: place.types?.map((t) => t.placeType),
    }));

    return {
      total,
      page,
      limit,
      data: editedData,
    };
  }

  async findAllPlacesWithRepPoint() {
    const qb = this.placeRepository
      .createQueryBuilder('place')
      .leftJoinAndSelect('place.types', 'placePlaceType')
      .leftJoinAndSelect('placePlaceType.placeType', 'placeType')
      .where('place.latitude IS NOT NULL')
      .andWhere('place.longitude IS NOT NULL')
      .andWhere('place.isModern = false')
      .orderBy('place.likeCount', 'DESC')
      .distinct(true);

    const [allPlaces] = await qb.getManyAndCount();

    const filteredPlaces: Place[] = [];
    const minDistance = 0.1; // 약 10km 간격

    for (const place of allPlaces) {
      const isTooClose = filteredPlaces.some((existing) => {
        const latDiff = Math.abs(existing.latitude - place.latitude);
        const lngDiff = Math.abs(existing.longitude - place.longitude);
        return latDiff < minDistance && lngDiff < minDistance;
      });

      if (!isTooClose) {
        filteredPlaces.push(place);
      }
    }

    return {
      total: filteredPlaces.length,
      page: -1,
      limit: -1,
      data: filteredPlaces.map((place) => ({
        ...place,
        types: place.types.map((ppt) => ppt.placeType),
      })),
    };
  }

  async findMyPlaces(userId: number, getMyPlacesDto: GetMyPlacesDto) {
    const { limit, page, filter } = getMyPlacesDto;

    // await this.delay(3000);

    // throw new BadRequestException('heello');

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

  async findMyCollectionPlaceIds(userId: number) {
    const [likedIdsRaw, savedIdsRaw, memoedIdsRaw] = await Promise.all([
      this.dataSource.query(
        `SELECT "placeId" FROM "user_place_like" WHERE "userId" = $1`,
        [userId],
      ),
      this.dataSource.query(
        `SELECT "placeId" FROM "user_place_save" WHERE "userId" = $1`,
        [userId],
      ),
      this.dataSource.query(
        `SELECT "placeId" FROM "user_place_memo" WHERE "userId" = $1`,
        [userId],
      ),
    ]);

    const liked = likedIdsRaw.map((row) => String(row.placeId));
    const bookmarked = savedIdsRaw.map((row) => String(row.placeId));
    const memoed = memoedIdsRaw.map((row) => String(row.placeId));

    return {
      liked,
      bookmarked,
      memoed,
    };
  }

  async findOne(id: string, userId: number | undefined | null) {
    // await this.delay(3000);

    const place = await this.placeRepository.findOne({
      where: { id },
      relations: [
        'types',
        'types.placeType',
        'childRelations',
        'childRelations.child',
        'childRelations.child.types',
        'childRelations.child.types.placeType',
        'parentRelations',
        'parentRelations.parent',
        'parentRelations.parent.types',
        'parentRelations.parent.types.placeType',
      ],
    });

    if (!place) {
      throw new NotFoundException('존재하지 않는 id값의 장소입니다.');
    }

    const likeCount = await this.userPlaceLikeRepository
      .createQueryBuilder('like')
      .innerJoin('like.user', 'user')
      .where('like.place = :placeId', { placeId: place.id })
      .getCount();

    const response = {
      ...place,
      likeCount,
      childRelations: place.childRelations.map((rel) => ({
        ...rel,
        place: {
          ...rel.child,
          types: rel.child.types.map((ppt) => ppt.placeType),
        },
      })),
      parentRelations: place.parentRelations.map((rel) => ({
        ...rel,
        place: {
          ...rel.parent,
          types: rel.parent.types.map((ppt) => ppt.placeType),
        },
      })),
      types: place.types.map((ppt) => ppt.placeType),
    };

    if (!userId) {
      return response;
    }

    const userInfo = await this.findRelatedUserInfo(id, userId);

    return {
      ...response,
      ...userInfo,
    };
  }

  async findRelatedUserInfo(id: string, userId: number) {
    const [isLiked, isSaved, memo] = await Promise.all([
      this.userPlaceLikeRepository.findOne({
        where: {
          user: userId as any,
          place: id as any,
        },
      }),
      this.userPlaceSaveRepository.findOne({
        where: {
          user: userId as any,
          place: id as any,
        },
      }),
      this.userPlaceMemoRepository.findOne({
        where: {
          user: userId as any,
          place: id as any,
        },
      }),
    ]);

    return {
      isLiked: !!isLiked,
      isSaved: !!isSaved,
      memo,
    };
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
    await this.findOne(id, null);

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

  async findGeoJSON(placeId: string): Promise<FeatureCollection> {
    let geojsonObject: FeatureCollection;

    try {
      // GeoJSON 데이터 가져오기
      const response = await axios.get(
        `${this.geoJsonBaseURL}/${placeId}.geojson`,
      );
      geojsonObject = response.data;
    } catch (e) {
      throw new NotFoundException('해당 장소의 GeoJSON이 존재하지 않습니다.');
    }

    // 장소 정보 조회
    const place = await this.placeRepository.findOne({
      where: { id: placeId },
      relations: [
        'childRelations',
        'childRelations.child',
        'parentRelations',
        'parentRelations.parent',
      ],
    });

    if (!place) {
      throw new NotFoundException('존재하지 않는 장소입니다.');
    }

    if (place.childRelations.length > 0 || place.parentRelations.length > 0) {
      const features = [...geojsonObject.features].map((feature) => {
        const placeId = feature.properties?.id.split('.')?.[0];

        if (!placeId) {
          return feature;
        }

        const parentRelation = place.parentRelations.find(
          (rel) => rel.parent.id === placeId,
        );

        const childRelation = place.childRelations.find(
          (rel) => rel.child.id === placeId,
        );

        if (parentRelation) {
          return {
            ...feature,
            properties: {
              ...feature.properties,
              isParent: true,
              possibility: parentRelation.possibility,
            },
          };
        }

        if (childRelation) {
          return {
            ...feature,
            properties: {
              ...feature.properties,
              isParent: false,
              possibility: childRelation.possibility,
            },
          };
        }

        return feature;
      });

      return { ...geojsonObject, features };
    }

    return geojsonObject;
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
      const limit = 10;

      const start = page * limit;
      const end = (page + 1) * limit;

      const slicedResult = result.slice(start, end);

      const parentTotal = slicedResult.length;

      const relations: {
        parentId: string;
        childId: string | undefined;
        possibility: number | null;
      }[] = [];
      const relationKeys = new Set<string>();

      for (let i = 0; i < parentTotal; i += batchParentSize) {
        const batch = slicedResult.slice(i, i + batchParentSize);

        const promises = batch.map(async (place) => {
          const fullUrl = `${this.baseURL}${place.placeUrl}`;
          const res = await axios.get(fullUrl);
          const $ = cheerio.load(res.data);

          const identificationPaths: any[] = [];

          let unknownPlacePossibility: number | null = null;

          const raw = $('tr')
            .filter(
              (_, el) =>
                $(el).find('th').text().trim() === 'Type' ||
                $(el).find('th').text().trim() === 'Types',
            )
            .find('td')
            .text()
            .trim();

          const types = raw
            .replace(/\s+or\s+/g, ',')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);

          const anotherNames = $('tr')
            .filter((_, el) => $(el).find('th').text().trim() === 'Also Called')
            .find('td')
            .text()
            .trim();

          const response = await axios.get(
            `${this.geoJsonBaseURL}/${place.id}.geojson`,
          );
          const geojsonObject = response.data;

          // 👉 JSON → string
          const geojsonText = JSON.stringify(geojsonObject);
          $('ol')
            .first()
            .children('li')
            .each((_, el) => {
              const liText = $(el).text().toLowerCase();

              const isUnknown = liText.includes('unknown');

              if (isUnknown) {
                const match = liText.match(/(\d+)%/);
                const rate = match ? Number(match[1]) : null;
                unknownPlacePossibility = rate;
                return;
              }

              const isPerfect = liText.includes('very high confidence');
              const match = liText.match(/(\d+)%/);
              const possibility = match ? Number(match[1]) : null;

              // a.img 태그들에서 featureClick 추출
              const imgLinks = $(el).find('a.img');
              const paths: string[] = [];

              if (imgLinks.length > 0) {
                imgLinks.each((_, imgLink) => {
                  const onclick = $(imgLink).attr('onclick');
                  const featureClickMatch = onclick?.match(
                    /featureClick\('([^']+)'\)/,
                  );
                  if (featureClickMatch) {
                    const featureId = featureClickMatch[1];
                    const childId = featureId.split('.')[0];
                    const period = childId.startsWith('m')
                      ? 'modern'
                      : 'ancient';
                    const path = `/geo/${period}/${childId}`;

                    // paths도 겹친게 있으면 추가 안하기
                    if (!paths.includes(path)) {
                      paths.push(path);
                    }

                    // relations 겹친게 있으면 (parentId, childId) 조합으로 그럼 추가 안하기
                    const relationKey = `${place.id}-${childId}`;
                    if (!relationKeys.has(relationKey)) {
                      relationKeys.add(relationKey);
                      relations.push({
                        parentId: place.id,
                        childId,
                        possibility: isPerfect ? 100 : possibility,
                      });
                    }
                  }
                });
              }

              paths.forEach((path) => {
                if (!identificationPaths.includes(path)) {
                  identificationPaths.push(path);
                }
              });
            });

          return {
            ...place,
            id: place.id,
            identificationPaths,
            types,
            unknownPlacePossibility,
            geojsonText,
            anotherNames: anotherNames || null,
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
          const [, , , placeId] = placeUrl.split('/');

          const fullUrl = `${this.baseURL}${placeUrl}`;
          const res = await axios.get(fullUrl);
          const $ = cheerio.load(res.data);
          const hasAbout = $('h2')
            .toArray()
            .some((el) => $(el).text().includes('About'));

          const name = $('h1').text();

          const types = $('tr')
            .filter(
              (_, el) =>
                $(el).find('th').text().trim() === 'Type' ||
                $(el).find('th').text().trim() === 'Types',
            )
            .find('td')
            .text()
            .trim()
            .replace(/\s+or\s+/g, ',')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);

          const anotherNames = $('tr')
            .filter((_, el) => $(el).find('th').text().trim() === 'Also Called')
            .find('td')
            .text()
            .trim();

          const imageTitle = $('img.thumbnail-0')
            .attr('src')
            ?.split('/')
            ?.at(-1);

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
            isModern: true,
            stereo: 'child',
            description: '',
            koreanDescription: '',
            imageTitle,
            types,
            geojsonText,
            anotherNames: anotherNames || null,
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

      const dir = join(process.cwd(), 'new-places-data');
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
    const zipUrl =
      'https://raw.githubusercontent.com/roddyisthebest/bible-atlas-server/main/ai-places-data.zip';
    const tempDir = join(process.cwd(), 'temp-ai-data');
    const zipPath = join(tempDir, 'ai-place-data.zip');

    try {
      // 임시 디렉토리 생성
      const fs = await import('fs/promises');
      await fs.mkdir(tempDir, { recursive: true });

      // ZIP 파일 다운로드
      const response = await axios.get(zipUrl, { responseType: 'arraybuffer' });
      await fs.writeFile(zipPath, response.data);

      // ZIP 파일 압축 해제
      const AdmZip = require('adm-zip');
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(tempDir, true);

      // JSON 파일들 찾기
      const extractedDir = join(tempDir, 'ai-places-data');
      const fileNames = await fs.readdir(extractedDir);
      const paths = fileNames
        .filter((file) => file.endsWith('.json'))
        .map((file) => join(extractedDir, file));

      if (paths.length === 0) {
        throw new Error('No JSON files found in extracted data');
      }

      let parsedUniquePlaces: Place[] = [];
      let parsedRelations: PlaceRelation[] = [];
      let parsedPlacePlaceTypes: PlacePlaceType[] = [];
      let parsedPlaceTypes: string[] = [];

      // 1. 파일 읽기 및 파싱 단계
      const files = await Promise.all(paths.map((path) => fs.readFile(path)));
      const parsedFiles: AiPlaceFile[] = files.map((buf) =>
        JSON.parse(buf.toString()),
      );

      const parsedDatas = parsedFiles.flatMap((parse) => parse.data);

      const uniqueDatas: AiPlaceData[] = [];

      parsedDatas.map((data) => {
        const existingDataIdx = uniqueDatas.findIndex((d) => d.id === data.id);

        if (existingDataIdx == -1) {
          uniqueDatas.push(data);
        } else {
          const existingData = uniqueDatas[existingDataIdx];
          const description =
            existingData.description.length > data.description.length
              ? existingData.description
              : data.description;
          const koreanDescription =
            existingData.koreanDescription.length >
            data.koreanDescription.length
              ? existingData.koreanDescription
              : data.koreanDescription;
          const verses = !!existingData.verses
            ? existingData.verses
            : data.verses || [];

          const imageTitle = existingData.imageTitle
            ? existingData.imageTitle
            : data.imageTitle;

          uniqueDatas.splice(existingDataIdx, 1, {
            ...existingData,
            description,
            koreanDescription,
            verses,
            imageTitle,
          });
        }
      });

      parsedUniquePlaces = uniqueDatas.map((data) => {
        const { latitude, longitude } = this.getRepresentativePoint(
          data.geojsonText,
        );

        const hasValidCoordinates = latitude !== null && longitude !== null;

        return {
          id: data.id,
          name: data.name,
          koreanName: data.koreanName,
          anotherNames: data.anotherNames,
          anotherKoreanNames: data.anotherKoreanNames,
          isModern: data.isModern,
          description: data.description,
          koreanDescription: data.koreanDescription,
          stereo: data.stereo,
          verse: data.verses?.join(', '),
          imageTitle: data.imageTitle,
          ...(hasValidCoordinates && {
            latitude,
            longitude,
          }),
        } as Place;
      });

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

      const allRelations = parsedFiles.flatMap((parse) => parse.relations);
      const uniqueRelationsMap = new Map<string, any>();

      allRelations.forEach((relation) => {
        const key = `${relation.parentId}-${relation.childId}`;
        if (!uniqueRelationsMap.has(key)) {
          uniqueRelationsMap.set(key, relation);
        }
      });

      parsedRelations = Array.from(uniqueRelationsMap.values()).map(
        (relation) => {
          const placeRelation = new PlaceRelation();
          placeRelation.parent = { id: relation.parentId } as Place;
          placeRelation.child = { id: relation.childId } as Place;
          placeRelation.possibility = relation.possibility;
          return placeRelation;
        },
      );
      // 2. DB 저장 단계
      return await this.dataSource.transaction(async (manager) => {
        await Promise.all([
          manager.delete(PlaceRelation, {}),
          manager.delete(PlacePlaceType, {}),
          manager.delete(PlaceType, {}),
          manager.delete(Place, {}),
        ]);

        await manager.save(Place, parsedUniquePlaces);
        console.log('place저장!');
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
      console.log(e);
      throw new InternalServerErrorException('처리 중 오류 발생', {
        cause: e,
      });
    }
  }

  @MinimumRole(Role.SUPER)
  async buildEntireData() {
    try {
      const fs = await import('fs/promises');

      const newPlacesDir = join(process.cwd(), 'new-places-data');
      const lightNewPlacesDir = join(process.cwd(), 'light-new-places-data');
      const aiPlacesDir = join(process.cwd(), 'ai-places-data');

      await fs.mkdir(aiPlacesDir, { recursive: true });

      const newPlacesFiles = await fs.readdir(newPlacesDir);
      const lightNewPlacesFiles = await fs.readdir(lightNewPlacesDir);

      console.log('new-places-data 파일들:', newPlacesFiles);
      console.log('light-new-places-data 파일들:', lightNewPlacesFiles);

      const pageGroups = new Map<
        string,
        { newFile?: string; lightFile?: string }
      >();

      newPlacesFiles.forEach((file) => {
        const pageMatch = file.match(/page[=\-_](\d+)/) || file.match(/(\d+)/);
        if (pageMatch) {
          const page = pageMatch[1];
          console.log(`new-places-data 파일 ${file} -> 페이지 ${page}`);
          if (!pageGroups.has(page)) pageGroups.set(page, {});
          pageGroups.get(page)!.newFile = file;
        }
      });

      lightNewPlacesFiles.forEach((file) => {
        const pageMatch = file.match(/page[=\-_](\d+)/) || file.match(/(\d+)/);
        if (pageMatch) {
          const page = pageMatch[1];
          console.log(`light-new-places-data 파일 ${file} -> 페이지 ${page}`);
          if (!pageGroups.has(page)) pageGroups.set(page, {});
          pageGroups.get(page)!.lightFile = file;
        }
      });

      console.log('페이지 그룹:', Array.from(pageGroups.entries()));

      for (const [page, files] of pageGroups) {
        console.log(`페이지 ${page} 처리 중:`, files);
        if (!files.newFile || !files.lightFile) {
          console.log(
            `페이지 ${page} 스킵: newFile=${files.newFile}, lightFile=${files.lightFile}`,
          );
          continue;
        }

        const newData = JSON.parse(
          await fs.readFile(join(newPlacesDir, files.newFile), 'utf-8'),
        );
        const lightData = JSON.parse(
          await fs.readFile(join(lightNewPlacesDir, files.lightFile), 'utf-8'),
        );

        const mergedData = lightData.data.map((lightPlace: any) => {
          const newPlace = newData.data.find(
            (np: any) => np.id === lightPlace.id,
          );
          return {
            ...newPlace,
            ...lightPlace,
            // geojsonText: newPlace?.geojsonText,
          };
        });

        const result = {
          data: mergedData,
          relations: lightData.relations || newData.relations || [],
          total: mergedData.length,
        };

        const outputFile = `merged-page-${page}.json`;
        await fs.writeFile(
          join(aiPlacesDir, outputFile),
          JSON.stringify(result),
          'utf-8',
        );
        console.log(`저장 완료: ${outputFile}`);
      }

      return {
        status: 200,
        message: `📌 ${pageGroups.size}개 페이지 데이터 병합 완료`,
      };
    } catch (error) {
      console.error('병합 오류:', error);
      throw new ConflictException('데이터 병합 중 오류 발생', error);
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

  async getPlacePrefixCounts() {
    // 🔹 1. 메인 결과: prefix + count
    const rawResult = await this.placeRepository.query(
      `
      SELECT
        LOWER(LEFT(name, 1)) AS prefix,
        COUNT(*) AS "placeCount"
      FROM place
      WHERE "isModern" = false
      GROUP BY prefix
      ORDER BY prefix ASC
    `,
    );

    // 🔹 2. 전체 prefix 개수 (a~z 중 사용된 개수)
    const totalResult = await this.placeRepository.query(`
      SELECT COUNT(*) FROM (
        SELECT LOWER(LEFT(name, 1)) AS prefix
        FROM place
        WHERE "isModern" = false
        GROUP BY prefix
      ) AS sub
    `);

    return {
      total: Number(totalResult[0].count),
      data: rawResult, // ex) [{ prefix: "a", placeCount: 12 }]
    };
  }

  async getPlaceBibleBookCounts() {
    const bibleBookKeys = Object.keys(BibleBook) as (keyof typeof BibleBook)[];

    const caseStatements = bibleBookKeys
      .map(
        (key) =>
          `SUM(CASE WHEN verse LIKE '%${key}%' THEN 1 ELSE 0 END) AS "${BibleBook[key]}"`,
      )
      .join(', ');

    const rawResult = await this.placeRepository.query(
      `SELECT ${caseStatements} FROM place WHERE "isModern" = false`,
    );

    const results: { bible: string; placeCount: number }[] = [];
    const row = rawResult[0];

    for (const bookKey of bibleBookKeys) {
      const count = Number(row[BibleBook[bookKey]]);
      if (count > 0) {
        results.push({
          bible: bookKey,
          placeCount: count,
        });
      }
    }

    return {
      total: results.length,
      data: results,
    };
  }

  async getBibleVerse(getVerseDto: GetVerseDto) {
    const { verse, book, chapter, version } = getVerseDto;

    // const agent = new https.Agent({ rejectUnauthorized: false });

    try {
      const res = await axios.get(
        `${this.bibleURL}?${version}-${book}/${chapter}:${verse}`,
      );

      const $ = cheerio.load(res.data);
      const small = $('small')
        .filter((_, el) => $(el).text().trim() === `${chapter}:${verse}`)
        .get(0); // 첫 번째 small 엘리먼트

      const verseText =
        small?.next && small.next.type === 'text' && small.next.data?.trim();

      return { text: verseText };
    } catch (e) {
      this.logger.error('❌ Failed to fetch bible verse from web', e);
      throw new ConflictException('Failed to fetch bible verse from web', e);
    }
  }

  getRepresentativePoint(geoJsonText: string) {
    const geoJson: FeatureCollection = JSON.parse(geoJsonText);
    const allCoordinates: [number, number][] = [];

    geoJson.features.forEach((feature) => {
      if (!feature.geometry?.['coordinates']) return;

      const coords = feature.geometry?.['coordinates'];

      if (feature.geometry.type === 'Point') {
        allCoordinates.push(coords as [number, number]);
      } else {
        const flatCoords = (coords as number[][][]).flat(3);
        const featureCoords: [number, number][] = [];
        for (let i = 0; i < flatCoords.length; i += 2) {
          featureCoords.push([flatCoords[i], flatCoords[i + 1]]);
        }
        if (featureCoords.length > 0) {
          const avgLng =
            featureCoords.reduce((sum, coord) => sum + coord[0], 0) /
            featureCoords.length;
          const avgLat =
            featureCoords.reduce((sum, coord) => sum + coord[1], 0) /
            featureCoords.length;
          allCoordinates.push([avgLng, avgLat]);
        }
      }
    });

    if (allCoordinates.length === 0) {
      return { longitude: null, latitude: null };
    }

    const avgLongitude =
      allCoordinates.reduce((sum, coord) => sum + coord[0], 0) /
      allCoordinates.length;
    const avgLatitude =
      allCoordinates.reduce((sum, coord) => sum + coord[1], 0) /
      allCoordinates.length;

    return {
      longitude: avgLongitude,
      latitude: avgLatitude,
    };
  }
}

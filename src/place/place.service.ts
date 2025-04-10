import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as pLimit from 'p-limit';
import { Observable, Subject, map } from 'rxjs';

@Injectable()
export class PlaceService {
  private readonly baseURL = 'https://www.openbible.info';
  private readonly geoJsonBaseURL = 'https://a.openbible.info/geo/data';
  private readonly logger = new Logger(PlaceService.name);

  private progressStreams = new Map<number, Subject<{ progress: number }>>();

  create(createPlaceDto: CreatePlaceDto) {
    return 'This action adds a new place';
  }

  findAll() {
    return `This action returns all place`;
  }

  findOne(id: number) {
    return `This action returns a #${id} place`;
  }

  update(id: number, updatePlaceDto: UpdatePlaceDto) {
    return `This action updates a #${id} place`;
  }

  remove(id: number) {
    return `This action removes a #${id} place`;
  }

  async scrapPlacesFromWeb(userId: number) {
    try {
      const res = await axios.get(`${this.baseURL}/geo/atlas/all`);
      const $ = cheerio.load(res.data);
      const result: any[] = [];
      const details: any[] = [];
      const childDetails: any[] = [];
      $('h2[id]').each((_, el) => {
        const h2 = $(el);
        const p = h2.next('p');
        const id = h2.attr('id');
        const title = h2.text().trim();
        const imageTag = p.find('img');
        const imageUrl = imageTag.attr('src');

        const placeLinkTag = p.find('a').first();
        const placeUrl = placeLinkTag.attr('href');

        const rawHtml = p.html() || '';
        const descMatch = rawHtml.match(
          /Possible identifications\)<\/a>:\s*([^<]+)/,
        );
        const description = descMatch ? descMatch[1].trim() : '';

        const verses: string[] = [];
        p.find('a[href*="biblegateway"]').each((_, a) => {
          const href = $(a).attr('href');
          if (href) verses.push(href);
        });

        result.push({
          id,
          title,
          imageUrl,
          placeUrl,
          description,
          verses,
        });
      });

      const placeUrls = result.map((re) => re.placeUrl);

      const batchParentSize = 5;
      let doneParentCount = 0;
      const parentTotal = 50;

      for (let i = 0; i < parentTotal; i += batchParentSize) {
        const batch = result.slice(i, i + batchParentSize);

        const promises = batch.map(async (place) => {
          const fullUrl = `${this.baseURL}${place.placeUrl}`;
          const res = await axios.get(fullUrl);
          const $ = cheerio.load(res.data);

          const identificationPaths: any[] = [];
          const types = $('tr')
            .filter(
              (_, el) =>
                $(el).find('th').text().trim() === 'Type' ||
                $(el).find('th').text().trim() === 'Types',
            )
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
            .filter((_, el) => {
              const liText = $(el).text().toLowerCase(); // 소문자 비교를 위해
              return !liText.includes('another name');
            })
            .each((_, el) => {
              const path = $(el).find('a').attr('href');
              if (!path) {
                return;
              }
              identificationPaths.push(path);
            });

          return {
            id: place.id,
            identificationPaths,
            types,
            geojsonText,
          };
        });

        const detail = await Promise.all(promises); // ✅ 병렬 실행

        details.push(...detail);

        doneParentCount += batch.length;
        const progress = Number(
          ((doneParentCount / parentTotal / 2) * 100).toFixed(1),
        );
        this.pushProgress(userId, progress); // ✅ 진행률 전송

        await this.delay(1000); // ✅ 다음 배치 전에 잠깐 딜레이
      }

      const identificationPaths: string[] = details.flatMap(
        (d) => d.identificationPaths,
      );
      const pureIdentificationPaths: string[] = Array.from(
        new Set(details.flatMap((d) => d.identificationPaths)),
      );

      const batchChildSize = 5;
      let doneChildCount = 0;

      const childTotal = 50;
      // const childTotal = pureIdentificationPaths.length

      for (let i = 0; i < childTotal; i += batchChildSize) {
        const batch = pureIdentificationPaths.slice(i, i + batchChildSize);
        const promises = batch.map(async (placeUrl) => {
          // "/geo/ancient/a64f355/bethel-1"

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
            .trim();

          const response = await axios.get(
            `${this.geoJsonBaseURL}/${placeId}.geojson`,
          );
          const geojsonObject = response.data;

          // 👉 JSON → string
          const geojsonText = JSON.stringify(geojsonObject);

          if (!hasAbout) {
            return null;
          }

          return {
            id: placeId,
            name,
            period,
            geojsonText,
            types,
          };
        });

        const detail = await Promise.all(promises); // ✅ 병렬 실행
        childDetails.push(...detail);
        doneChildCount += batch.length;
        const progress =
          50 + Number(((doneChildCount / childTotal / 2) * 100).toFixed(1));
        this.pushProgress(userId, progress); // ✅ 진행률 전송

        await this.delay(1000); // ✅ 다음 배치 전에 잠깐 딜레이
      }

      return {
        result,
        details,
        childDetails,
        total: result.length,
      };
    } catch (error) {
      this.logger.error('❌ Failed to scrap places from web', error);
      throw new ConflictException('에러!', error);
    }
  }

  async scrapImages(userId: number) {}

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

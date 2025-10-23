import { IsEnum, IsIn, IsNotEmpty, IsNumber } from 'class-validator';
import { BibleBook, BibleVersion } from '../const/place.const';

export class GetVerseDto {
  @IsNotEmpty()
  @IsIn(Object.values(BibleBook))
  book: keyof typeof BibleBook;

  @IsNotEmpty()
  @IsEnum(BibleVersion)
  version: BibleVersion = BibleVersion.kor;

  @IsNotEmpty()
  @IsNumber()
  chapter: number;

  @IsNotEmpty()
  @IsNumber()
  verse: number;
}

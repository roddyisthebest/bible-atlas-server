import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyKakaoTokenDto {
  @IsString()
  @IsNotEmpty()
  accessToken: string;
}

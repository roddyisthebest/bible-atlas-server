import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyAppleTokenDto {
  @IsString()
  @IsNotEmpty()
  idToken: string;
}

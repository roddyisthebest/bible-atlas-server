import { IsBoolean, IsNotEmpty } from 'class-validator';

export class ToggleAgreementDto {
  @IsBoolean()
  @IsNotEmpty()
  isAgree = true;
}

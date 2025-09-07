import { IsString, IsNotEmpty, Length } from 'class-validator';

export class CaptchaDto {
  @IsString()
  @IsNotEmpty()
  @Length(5, 5)
  captcha: string;
}

export class LoginWithCaptchaDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 100)
  password: string;

  @IsString()
  @IsNotEmpty()
  @Length(5, 5)
  captcha: string;
}

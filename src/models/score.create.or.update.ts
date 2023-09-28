import { IsNotEmpty, IsEmail, Length, IsString, IsNumber } from "class-validator";

export class ScoreCreateOrUpdateDto {
  @IsNotEmpty()
  @Length(1, 20)
  public fullname: string;

  @IsNotEmpty()
  @IsString()
  public dial_code: string;

  @IsNotEmpty()
  @IsString()
  public phone_number: string;

  @IsNotEmpty()
  @IsEmail()
  public email: string;

  @IsNotEmpty()
  @IsNumber()
  public scores: number;
}

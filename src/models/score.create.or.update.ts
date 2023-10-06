import { IsNotEmpty, IsNumber, IsString, Length } from "class-validator";

export class ScoreCreateOrUpdateDto {
  @IsNotEmpty()
  @Length(1, 20)
  public fullname: string;

  @IsNotEmpty()
  @IsString()
  public phone_number: string;

  @IsNotEmpty()
  @IsString()
  public agency: string;

  @IsNotEmpty()
  @IsString()
  public role: string;

  @IsNotEmpty()
  @IsNumber()
  public score: number;
}

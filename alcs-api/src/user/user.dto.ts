import { AutoMap } from '@automapper/classes';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDefined,
  IsEmail,
  IsOptional,
  IsString,
} from 'class-validator';

export class UserSettingsDto {
  favoriteBoards: string[];
}

export class CreateOrUpdateUserDto {
  @AutoMap()
  @IsOptional()
  uuid?: string;

  @AutoMap()
  @IsEmail()
  email: string;

  @AutoMap()
  @IsString()
  displayName: string;

  @AutoMap()
  @IsString()
  identityProvider: string;

  @AutoMap()
  @IsString()
  preferredUsername: string;

  @AutoMap()
  @IsString()
  name?: string;

  @AutoMap()
  @IsString()
  givenName?: string;

  @AutoMap()
  @IsString()
  familyName?: string;

  @AutoMap()
  @IsString()
  idirUserGuid?: string;

  @AutoMap()
  @IsString()
  idirUserName?: string;

  @AutoMap()
  @IsString()
  @IsOptional()
  bceidGuid?: string;

  @AutoMap()
  @IsString()
  @IsOptional()
  bceidUserName?: string;

  @AutoMap()
  @IsArray()
  @IsOptional()
  clientRoles?: string[];

  @AutoMap()
  @Type(() => UserSettingsDto)
  @IsDefined()
  settings?: UserSettingsDto;
}

export class UserDto extends CreateOrUpdateUserDto {
  @AutoMap()
  @IsString()
  initials?: string;

  @AutoMap()
  @IsString()
  mentionLabel: string;
}

export class AssigneeDto {
  @AutoMap()
  uuid: string;

  @AutoMap()
  initials?: string;

  @AutoMap()
  name?: string;
}
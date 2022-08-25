import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { AutoMap } from '@automapper/classes';
import { UserDto } from '../user/user.dto';
import { ApplicationRegionDto } from './application-code/application-region/application-region.dto';
import { ApplicationStatusDto } from './application-status/application-status.dto';
import { ApplicationTypeDto } from './application-code/application-type/application-type.dto';

export class CreateApplicationDto {
  @AutoMap()
  @IsNotEmpty()
  @IsString()
  fileNumber: string;

  @AutoMap()
  @IsNotEmpty()
  @IsString()
  applicant: string;

  @IsNotEmpty()
  @IsString()
  type: string;

  @IsString()
  @IsOptional()
  region?: string;
}

export class ApplicationDto {
  @AutoMap()
  @IsNotEmpty()
  @IsString()
  fileNumber: string;

  @AutoMap()
  @IsNotEmpty()
  @IsString()
  applicant: string;

  @IsNotEmpty()
  @IsString()
  status: string;

  @AutoMap()
  @IsUUID()
  assigneeUuid?: string;

  @AutoMap()
  assignee?: UserDto;

  @AutoMap()
  activeDays: number;

  @AutoMap()
  pausedDays: number;

  @AutoMap()
  @IsBoolean()
  paused: boolean;

  @AutoMap()
  @IsBoolean()
  highPriority: boolean;

  @IsNotEmpty()
  @IsString()
  type: string;

  @IsNotEmpty()
  @IsString()
  board: string;

  @IsString()
  region?: string;
}

export class ApplicationDetailedDto extends ApplicationDto {
  @AutoMap()
  statusDetails: ApplicationStatusDto;

  @AutoMap()
  typeDetails: ApplicationTypeDto;

  @AutoMap()
  regionDetails: ApplicationRegionDto;
}

export class ApplicationUpdateDto {
  @AutoMap()
  @IsNotEmpty()
  @IsString()
  fileNumber: string;

  @AutoMap()
  @IsOptional()
  @IsString()
  applicant?: string;

  @AutoMap()
  @IsOptional()
  @IsString()
  type?: string;

  @AutoMap()
  @IsOptional()
  @IsString()
  region?: string;

  @AutoMap()
  @IsOptional()
  @IsString()
  status?: string;

  @AutoMap()
  @IsOptional()
  @IsUUID()
  assigneeUuid?: string;

  @AutoMap()
  @IsBoolean()
  @IsOptional()
  paused?: boolean;

  @AutoMap()
  @IsBoolean()
  @IsOptional()
  highPriority?: boolean;
}

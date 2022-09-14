import { AutoMap } from '@automapper/classes';
import { IsBoolean, IsNumber, IsOptional, IsUUID } from 'class-validator';
import { ApplicationDto } from '../application.dto';

export class UpdateApplicationSubtaskDto {
  @AutoMap()
  @IsUUID()
  @IsOptional()
  assignee?: string;

  @AutoMap()
  @IsOptional()
  completedAt?: number | null;
}

export class ApplicationSubtaskDto {
  @AutoMap()
  uuid: string;

  @AutoMap()
  type: string;

  @AutoMap()
  backgroundColor: string;

  @AutoMap()
  textColor: string;

  @AutoMap()
  assignee?: string;

  @AutoMap()
  createdAt: number;

  @AutoMap()
  completedAt?: number;
}

export class ApplicationSubtaskWithApplicationDTO extends ApplicationSubtaskDto {
  application: ApplicationDto;
}
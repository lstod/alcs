import { AutoMap } from '@automapper/classes';
import { IsNotEmpty, IsString } from 'class-validator';

export class ApplicationStaffJournalDto {
  @AutoMap()
  uuid: string;

  @AutoMap()
  body: string;

  @AutoMap()
  author: string;

  @AutoMap()
  edited: boolean;

  @AutoMap()
  createdAt: number;

  isEditable = false;
}

export class CreateApplicationStaffJournalDto {
  @IsString()
  @IsNotEmpty()
  applicationUuid: string;

  @IsString()
  @IsNotEmpty()
  body: string;
}

export class UpdateApplicationStaffJournalDto {
  @IsString()
  @IsNotEmpty()
  uuid: string;

  @IsString()
  @IsNotEmpty()
  body: string;
}

import {
  afterMap,
  createMap,
  forMember,
  ignore,
  mapFrom,
  Mapper,
} from '@automapper/core';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';
import { ApplicationTypeService } from '../../alcs/application-type/application-type.service';
import { ApplicationDocumentDto } from '../../application/application-document/application-document.dto';
import { ApplicationDocument } from '../../application/application-document/application-document.entity';
import { ApplicationStatusDto } from '../../application/application-status/application-status.dto';
import { ApplicationStatus } from '../../application/application-status/application-status.entity';
import { ApplicationDto } from '../../application/application.dto';
import { Application } from '../../application/application.entity';

@Injectable()
export class ApplicationProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper) => {
      createMap(
        mapper,
        Application,
        ApplicationDto,
        forMember(
          (a) => a.documents,
          mapFrom((ad) => {
            if (ad.documents) {
              return this.mapper.mapArray(
                ad.documents,
                ApplicationDocument,
                ApplicationDocumentDto,
              );
            } else {
              return [];
            }
          }),
        ),
      );

      createMap(
        mapper,
        ApplicationDocument,
        ApplicationDocumentDto,
        forMember(
          (a) => a.uploadedBy,
          mapFrom((ad) => {
            return ad.uploadedBy.name;
          }),
        ),
      );

      createMap(mapper, ApplicationStatus, ApplicationStatusDto);
    };
  }
}
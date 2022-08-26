import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOAuth2 } from '@nestjs/swagger';
import * as config from 'config';
import { RoleGuard } from '../common/authorization/role.guard';
import { ANY_AUTH_ROLE } from '../common/authorization/roles';
import { UserRoles } from '../common/authorization/roles.decorator';
import { ServiceValidationException } from '../common/exceptions/base.exception';
import { NotificationService } from '../notification/notification.service';
import { ApplicationCodeService } from './application-code/application-code.service';
import { ApplicationRegion } from './application-code/application-region/application-region.entity';
import { ApplicationType } from './application-code/application-type/application-type.entity';
import { ApplicationStatus } from './application-status/application-status.entity';
import {
  ApplicationDetailedDto,
  ApplicationDto,
  ApplicationUpdateDto,
  CreateApplicationDto,
} from './application.dto';
import { ApplicationService } from './application.service';

@ApiOAuth2(config.get<string[]>('KEYCLOAK.SCOPES'))
@Controller('application')
@UseGuards(RoleGuard)
export class ApplicationController {
  constructor(
    private applicationService: ApplicationService,
    private codeService: ApplicationCodeService,
    private notificationService: NotificationService,
    @InjectMapper() private applicationMapper: Mapper,
  ) {}

  @Get()
  @UserRoles(...ANY_AUTH_ROLE)
  async getAll(): Promise<ApplicationDto[]> {
    const applications = await this.applicationService.getAll();
    return this.applicationService.mapToDtos(applications);
  }

  @Get('/:fileNumber')
  @UserRoles(...ANY_AUTH_ROLE)
  async get(@Param('fileNumber') fileNumber): Promise<ApplicationDetailedDto> {
    const application = await this.applicationService.get(fileNumber);
    const mappedApplication = await this.applicationService.mapToDtos([
      application,
    ]);
    return {
      ...mappedApplication[0],
      statusDetails: application.status,
      typeDetails: application.type,
      regionDetails: application.region,
    };
  }

  @Post()
  @UserRoles(...ANY_AUTH_ROLE)
  async create(
    @Body() application: CreateApplicationDto,
  ): Promise<ApplicationDto> {
    const type = await this.codeService.fetchType(application.type);

    const region = application.region
      ? await this.codeService.fetchRegion(application.region)
      : undefined;

    const app = await this.applicationService.createOrUpdate({
      ...application,
      type,
      region,
      dateReceived: new Date(application.dateReceived),
    });
    const mappedApps = await this.applicationService.mapToDtos([app]);
    return mappedApps[0];
  }

  @Patch()
  @UserRoles(...ANY_AUTH_ROLE)
  async update(
    @Body() application: ApplicationUpdateDto,
    @Req() req,
  ): Promise<ApplicationDetailedDto> {
    const existingApplication = await this.applicationService.get(
      application.fileNumber,
    );

    if (!existingApplication) {
      throw new ServiceValidationException(
        `File ${application.fileNumber} not found`,
      );
    }

    let status: ApplicationStatus | undefined;
    if (
      application.status &&
      application.status != existingApplication.status.code
    ) {
      status = await this.codeService.fetchStatus(application.status);
    }

    let type: ApplicationType | undefined;
    if (application.type && application.type != existingApplication.type.code) {
      type = await this.codeService.fetchType(application.type);
    }

    let region: ApplicationRegion | undefined;
    if (
      application.region &&
      (!existingApplication.region ||
        application.region != existingApplication.region.code)
    ) {
      region = await this.codeService.fetchRegion(application.region);
    }

    const updatedApplication = await this.applicationService.createOrUpdate({
      fileNumber: application.fileNumber,
      applicant: application.applicant,
      statusUuid: status ? status.uuid : undefined,
      typeUuid: type ? type.uuid : undefined,
      regionUuid: region ? region.uuid : undefined,
      assigneeUuid: application.assigneeUuid,
      paused: application.paused,
      highPriority: application.highPriority,
      datePaid: this.formatIncomingDate(application.datePaid),
      dateAcknowledgedIncomplete: this.formatIncomingDate(
        application.dateAcknowledgedIncomplete,
      ),
      dateReceivedAllItems: this.formatIncomingDate(
        application.dateReceivedAllItems,
      ),
      dateAcknowledgedComplete: this.formatIncomingDate(
        application.dateAcknowledgedComplete,
      ),
    });

    if (
      updatedApplication.assigneeUuid !== existingApplication.assigneeUuid &&
      updatedApplication.assigneeUuid !== req.user.entity.uuid
    ) {
      this.notificationService.createForApplication(
        req.user.entity,
        updatedApplication.assigneeUuid,
        "You've been assigned",
        updatedApplication,
      );
    }

    const mappedApps = await this.applicationService.mapToDtos([
      updatedApplication,
    ]);
    return {
      ...mappedApps[0],
      statusDetails: updatedApplication.status,
      typeDetails: updatedApplication.type,
      regionDetails: updatedApplication.region,
    };
  }

  @Delete()
  @UserRoles(...ANY_AUTH_ROLE)
  async softDelete(@Body() applicationNumber: string): Promise<void> {
    await this.applicationService.delete(applicationNumber);
  }

  private formatIncomingDate(date?: number) {
    if (date) {
      return new Date(date);
    } else if (date === null) {
      return null;
    } else {
      return undefined;
    }
  }
}

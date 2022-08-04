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
  UseGuards,
} from '@nestjs/common';
import { ApiOAuth2 } from '@nestjs/swagger';
import * as config from 'config';
import { RoleGuard } from '../common/authorization/role.guard';
import { UserRoles } from '../common/authorization/roles.decorator';
import { ANY_AUTH_ROLE } from '../common/enum';
import { ServiceValidationException } from '../common/exceptions/base.exception';
import { ApplicationDecisionMaker } from './application-decision-maker/application-decision-maker.entity';
import { ApplicationDecisionMakerService } from './application-decision-maker/application-decision-maker.service';
import { ApplicationStatus } from './application-status/application-status.entity';
import { ApplicationStatusService } from './application-status/application-status.service';
import { ApplicationTimeTrackingService } from './application-time-tracking.service';
import { ApplicationType } from './application-type/application-type.entity';
import { ApplicationTypeService } from './application-type/application-type.service';
import {
  ApplicationDetailedDto,
  ApplicationDto,
  ApplicationUpdateDto,
  CreateApplicationDto,
} from './application.dto';
import { Application } from './application.entity';
import { ApplicationService } from './application.service';

@ApiOAuth2(config.get<string[]>('KEYCLOAK.SCOPES'))
@Controller('application')
@UseGuards(RoleGuard)
export class ApplicationController {
  constructor(
    private applicationService: ApplicationService,
    private applicationStatusService: ApplicationStatusService,
    private applicationTypeService: ApplicationTypeService,
    private applicationDecisionMakerService: ApplicationDecisionMakerService,
    private applicationPausedService: ApplicationTimeTrackingService,
    @InjectMapper() private applicationMapper: Mapper,
  ) {}

  @Get()
  @UserRoles(...ANY_AUTH_ROLE)
  async getAll(): Promise<ApplicationDto[]> {
    const applications = await this.applicationService.getAll();
    return this.mapApplicationsToDtos(applications);
  }

  @Get('/:fileNumber')
  @UserRoles(...ANY_AUTH_ROLE)
  async get(@Param('fileNumber') fileNumber): Promise<ApplicationDetailedDto> {
    const application = await this.applicationService.get(fileNumber);
    const mappedApplication = await this.mapApplicationsToDtos([application]);
    return {
      ...mappedApplication[0],
      statusDetails: application.status,
      typeDetails: application.type,
      decisionMakerDetails: application.decisionMaker,
    };
  }

  @Post()
  @UserRoles(...ANY_AUTH_ROLE)
  async create(
    @Body() application: CreateApplicationDto,
  ): Promise<ApplicationDto> {
    const type = await this.applicationTypeService.get(application.type);
    const decisionMaker = application.decisionMaker
      ? await this.applicationDecisionMakerService.get(
          application.decisionMaker,
        )
      : undefined;
    const app = await this.applicationService.createOrUpdate({
      ...application,
      type,
      decisionMaker,
      title: 'Do we still need title?',
    });
    const mappedApps = await this.mapApplicationsToDtos([app]);
    return mappedApps[0];
  }

  @Patch()
  @UserRoles(...ANY_AUTH_ROLE)
  async update(
    @Body() application: ApplicationUpdateDto,
  ): Promise<ApplicationDto> {
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
      status = await this.applicationStatusService.fetchStatus(
        application.status,
      );
    }

    let type: ApplicationType | undefined;
    if (application.type && application.type != existingApplication.type.code) {
      type = await this.applicationTypeService.get(application.type);
    }

    let decisionMaker: ApplicationDecisionMaker | undefined;
    if (
      application.decisionMaker &&
      (!existingApplication.decisionMaker ||
        application.decisionMaker != existingApplication.decisionMaker.code)
    ) {
      decisionMaker = await this.applicationDecisionMakerService.get(
        application.decisionMaker,
      );
    }

    const app = await this.applicationService.createOrUpdate({
      fileNumber: application.fileNumber,
      title: application.title,
      applicant: application.applicant,
      statusUuid: status ? status.uuid : undefined,
      typeUuid: type ? type.uuid : undefined,
      decisionMakerUuid: decisionMaker ? decisionMaker.uuid : undefined,
      assigneeUuid: application.assigneeUuid,
      paused: application.paused,
    });

    const mappedApps = await this.mapApplicationsToDtos([app]);
    return mappedApps[0];
  }

  @Delete()
  @UserRoles(...ANY_AUTH_ROLE)
  async softDelete(@Body() applicationNumber: string): Promise<void> {
    await this.applicationService.delete(applicationNumber);
  }

  private async mapToEntity(
    application: ApplicationDto,
  ): Promise<Partial<Application>> {
    return this.applicationMapper.mapAsync(
      application,
      ApplicationDto,
      Application,
    );
  }

  private async mapApplicationsToDtos(
    applications: Application[],
  ): Promise<ApplicationDto[]> {
    const appTimeMap =
      await this.applicationPausedService.fetchApplicationActiveTimes(
        applications,
      );

    return applications.map((app) => ({
      ...this.applicationMapper.map(app, Application, ApplicationDto),
      activeDays: appTimeMap.get(app.uuid).activeDays || 0,
      pausedDays: appTimeMap.get(app.uuid).pausedDays || 0,
    }));
  }
}

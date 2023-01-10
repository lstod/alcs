import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LocalGovernmentService } from '../alcs/local-government/local-government.service';
import { AuthGuard } from '../common/authorization/auth-guard.service';
import { User } from '../user/user.entity';
import { ApplicationDocumentService } from './application-document/application-document.service';
import { APPLICATION_STATUS } from './application-status/application-status.dto';
import {
  ApplicationSubmitToAlcsDto,
  CreateApplicationDto,
  UpdateApplicationDto,
} from './application.dto';
import { ApplicationService } from './application.service';

@Controller('application')
@UseGuards(AuthGuard)
export class ApplicationController {
  constructor(
    private applicationService: ApplicationService,
    private documentService: ApplicationDocumentService,
    private localGovernmentService: LocalGovernmentService,
    @InjectMapper() private mapper: Mapper,
  ) {}

  @Get()
  async getApplications(@Req() req) {
    const user = req.user.entity as User;

    if (user.bceidBusinessGuid) {
      const localGovernments = await this.localGovernmentService.get();
      const matchingGovernment = localGovernments.find(
        (lg) => lg.bceidBusinessGuid === user.bceidBusinessGuid,
      );
      if (matchingGovernment) {
        const applications = await this.applicationService.getForGovernment(
          matchingGovernment,
        );

        return this.applicationService.mapToDTOs(
          [...applications],
          user,
          matchingGovernment,
        );
      }
    }

    const applications = await this.applicationService.getByUser(user);
    return this.applicationService.mapToDTOs(applications, user);
  }

  @Get('/:fileId')
  async getApplication(@Req() req, @Param('fileId') fileId: string) {
    const user = req.user.entity as User;
    const application = await this.applicationService.getIfCreator(
      fileId,
      user,
    );

    const mappedApps = await this.applicationService.mapToDTOs(
      [application],
      req.user.entity,
    );
    return mappedApps[0];
  }

  @Post()
  async create(@Req() req, @Body() body: CreateApplicationDto) {
    const { type } = body;
    const user = req.user.entity as User;
    const newFileNumber = await this.applicationService.create(type, user);
    return {
      fileId: newFileNumber,
    };
  }

  @Post('/:fileId')
  async update(
    @Param('fileId') fileId: string,
    @Body() updateDto: UpdateApplicationDto,
    @Req() req,
  ) {
    await this.applicationService.verifyAccess(fileId, req.user.entity);

    const application = await this.applicationService.update(fileId, {
      applicant: updateDto.applicant,
      localGovernmentUuid: updateDto.localGovernmentUuid,
    });

    const mappedApps = await this.applicationService.mapToDTOs(
      [application],
      req.user.entity,
    );
    return mappedApps[0];
  }

  @Post('/:fileId/cancel')
  async cancel(@Param('fileId') fileId: string, @Req() req) {
    const application = await this.applicationService.getIfCreator(
      fileId,
      req.user.entity,
    );

    if (application.status.code !== APPLICATION_STATUS.IN_PROGRESS) {
      throw new BadRequestException('Can only cancel in progress Applications');
    }

    const updatedApplication = await this.applicationService.cancel(
      application,
    );

    const mappedApps = await this.applicationService.mapToDTOs(
      [updatedApplication],
      req.user.entity,
    );
    return mappedApps[0];
  }

  @Post('/alcs/submit/:fileId')
  async submitAsApplicant(
    @Param('fileId') fileId: string,
    @Body() data: ApplicationSubmitToAlcsDto,
    @Req() req,
  ) {
    const application = await this.applicationService.getIfCreator(
      fileId,
      req.user.entity,
    );

    if (application.typeCode === 'TURP') {
      return await this.applicationService.submitToAlcs(fileId, data);
    } else {
      return await this.applicationService.submitToLg(fileId);
    }
  }
}

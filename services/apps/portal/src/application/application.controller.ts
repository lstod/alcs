import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LocalGovernmentService } from '../alcs/local-government/local-government.service';
import { AuthGuard } from '../common/authorization/auth-guard.service';
import { User } from '../user/user.entity';
import { ApplicationDocumentService } from './application-document/application-document.service';
import { APPLICATION_STATUS } from './application-status/application-status.dto';
import { ApplicationValidatorService } from './application-validator.service';
import { ApplicationCreateDto, ApplicationUpdateDto } from './application.dto';
import { ApplicationService } from './application.service';

@Controller('application')
@UseGuards(AuthGuard)
export class ApplicationController {
  private logger: Logger = new Logger(ApplicationController.name);

  constructor(
    private applicationService: ApplicationService,
    private documentService: ApplicationDocumentService,
    private localGovernmentService: LocalGovernmentService,
    private applicationValidatorService: ApplicationValidatorService,
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

    if (user.bceidBusinessGuid) {
      const localGovernment = await this.localGovernmentService.getByGuid(
        user.bceidBusinessGuid,
      );
      if (localGovernment) {
        const application =
          await this.applicationService.getForGovernmentByFileId(
            fileId,
            localGovernment,
          );
        return await this.applicationService.mapToDetailedDTO(
          application,
          localGovernment,
        );
      }
    }

    const application = await this.applicationService.getIfCreator(
      fileId,
      user,
    );

    return await this.applicationService.mapToDetailedDTO(application);
  }

  @Post()
  async create(@Req() req, @Body() body: ApplicationCreateDto) {
    const { type } = body;
    const user = req.user.entity as User;
    const newFileNumber = await this.applicationService.create(type, user);
    return {
      fileId: newFileNumber,
    };
  }

  @Put('/:fileId')
  async update(
    @Param('fileId') fileId: string,
    @Body() updateDto: ApplicationUpdateDto,
    @Req() req,
  ) {
    await this.applicationService.verifyAccess(fileId, req.user.entity);

    const application = await this.applicationService.update(fileId, updateDto);

    const mappedApps = await this.applicationService.mapToDetailedDTO(
      application,
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

    await this.applicationService.cancel(application);

    return {
      cancelled: true,
    };
  }

  @Post('/alcs/submit/:fileId')
  async submitAsApplicant(@Param('fileId') fileId: string, @Req() req) {
    const application = await this.applicationService.getIfCreator(
      fileId,
      req.user.entity,
    );

    const validationResult =
      await this.applicationValidatorService.validateApplication(application);

    if (validationResult.application) {
      const validApplication = validationResult.application;
      if (validApplication.typeCode === 'TURP') {
        await this.applicationService.submitToAlcs(validApplication);
        return await this.applicationService.updateStatus(
          application,
          APPLICATION_STATUS.SUBMITTED_TO_ALC,
        );
      } else {
        return await this.applicationService.submitToLg(validApplication);
      }
    } else {
      this.logger.debug(validationResult.errors);
      throw new BadRequestException('Invalid Application');
    }
  }
}

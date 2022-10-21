import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import {
  BadRequestException,
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
import { RoleGuard } from '../../common/authorization/role.guard';
import { ANY_AUTH_ROLE } from '../../common/authorization/roles';
import { UserRoles } from '../../common/authorization/roles.decorator';
import { ApplicationService } from '../application.service';
import { DecisionOutcomeCode } from './application-decision-outcome.entity';
import {
  ApplicationDecisionDto,
  ApplicationDecisionOutcomeTypeDto,
  CreateApplicationDecisionDto,
  UpdateApplicationDecisionDto,
} from './application-decision.dto';
import { ApplicationDecision } from './application-decision.entity';
import { ApplicationDecisionService } from './application-decision.service';
import { CeoCriterionCodeDto } from './ceo-criterion/ceo-criterion.dto';
import { CeoCriterionCode } from './ceo-criterion/ceo-criterion.entity';
import { DecisionMakerCodeDto } from './decision-maker/decision-maker.dto';
import { DecisionMakerCode } from './decision-maker/decision-maker.entity';

@ApiOAuth2(config.get<string[]>('KEYCLOAK.SCOPES'))
@Controller('application-decision')
@UseGuards(RoleGuard)
export class ApplicationDecisionController {
  constructor(
    private appDecisionService: ApplicationDecisionService,
    private applicationService: ApplicationService,
    @InjectMapper() private mapper: Mapper,
  ) {}

  @Get('/application/:fileNumber')
  @UserRoles(...ANY_AUTH_ROLE)
  async getByFileNumber(
    @Param('fileNumber') fileNumber,
  ): Promise<ApplicationDecisionDto[]> {
    const decisions = await this.appDecisionService.getByAppFileNumber(
      fileNumber,
    );
    return this.mapper.mapArrayAsync(
      decisions,
      ApplicationDecision,
      ApplicationDecisionDto,
    );
  }

  @Get('/codes')
  @UserRoles(...ANY_AUTH_ROLE)
  async getCodes() {
    const codes = await this.appDecisionService.fetchCodes();
    return {
      outcomes: await this.mapper.mapArrayAsync(
        codes.outcomes,
        DecisionOutcomeCode,
        ApplicationDecisionOutcomeTypeDto,
      ),
      decisionMakers: await this.mapper.mapArrayAsync(
        codes.decisionMakers,
        DecisionMakerCode,
        DecisionMakerCodeDto,
      ),
      ceoCriterion: await this.mapper.mapArrayAsync(
        codes.ceoCriterion,
        CeoCriterionCode,
        CeoCriterionCodeDto,
      ),
    };
  }

  @Get('/:uuid')
  @UserRoles(...ANY_AUTH_ROLE)
  async get(@Param('uuid') uuid: string): Promise<ApplicationDecisionDto> {
    const meeting = await this.appDecisionService.get(uuid);
    return this.mapper.mapAsync(
      meeting,
      ApplicationDecision,
      ApplicationDecisionDto,
    );
  }

  @Post()
  @UserRoles(...ANY_AUTH_ROLE)
  async create(
    @Body() meeting: CreateApplicationDecisionDto,
  ): Promise<ApplicationDecisionDto> {
    const application = await this.applicationService.getOrFail(
      meeting.applicationFileNumber,
    );

    const newDecision = await this.appDecisionService.create(
      meeting,
      application,
    );

    return this.mapper.mapAsync(
      newDecision,
      ApplicationDecision,
      ApplicationDecisionDto,
    );
  }

  @Patch('/:uuid')
  @UserRoles(...ANY_AUTH_ROLE)
  async update(
    @Param('uuid') uuid: string,
    @Body() appDecMeeting: UpdateApplicationDecisionDto,
  ): Promise<ApplicationDecisionDto> {
    const updatedMeeting = await this.appDecisionService.update(
      uuid,
      appDecMeeting,
    );
    return this.mapper.mapAsync(
      updatedMeeting,
      ApplicationDecision,
      ApplicationDecisionDto,
    );
  }

  @Delete('/:uuid')
  @UserRoles(...ANY_AUTH_ROLE)
  async delete(@Param('uuid') uuid: string) {
    return await this.appDecisionService.delete(uuid);
  }

  @Post('/:uuid/file')
  @UserRoles(...ANY_AUTH_ROLE)
  async attachDocument(@Param('uuid') decisionUuid: string, @Req() req) {
    if (!req.isMultipart()) {
      throw new BadRequestException('Request is not multipart');
    }

    const file = await req.file();
    await this.appDecisionService.attachDocument(
      decisionUuid,
      file,
      req.user.entity,
    );
    return {
      uploaded: true,
    };
  }

  @Get('/:uuid/file/:fileUuid/download')
  @UserRoles(...ANY_AUTH_ROLE)
  async getDownloadUrl(
    @Param('uuid') decisionUuid: string,
    @Param('fileUuid') documentUuid: string,
  ) {
    const downloadUrl = await this.appDecisionService.getDownloadUrl(
      documentUuid,
    );
    return {
      url: downloadUrl,
    };
  }

  @Get('/:uuid/file/:fileUuid/open')
  @UserRoles(...ANY_AUTH_ROLE)
  async getOpenUrl(
    @Param('uuid') decisionUuid: string,
    @Param('fileUuid') documentUuid: string,
  ) {
    const downloadUrl = await this.appDecisionService.getDownloadUrl(
      documentUuid,
      true,
    );
    return {
      url: downloadUrl,
    };
  }

  @Delete('/:uuid/file/:fileUuid')
  @UserRoles(...ANY_AUTH_ROLE)
  async deleteDocument(
    @Param('uuid') decisionUuid: string,
    @Param('fileUuid') documentUuid: string,
  ) {
    await this.appDecisionService.deleteDocument(documentUuid);
    return {
      deleted: true,
    };
  }
}
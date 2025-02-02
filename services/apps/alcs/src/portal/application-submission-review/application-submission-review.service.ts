import {
  BaseServiceException,
  ServiceNotFoundException,
} from '@app/common/exceptions/base.exception';
import { Mapper } from '@automapper/core';
import { InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationLocalGovernment } from '../../alcs/application/application-code/application-local-government/application-local-government.entity';
import { DOCUMENT_TYPE } from '../../alcs/application/application-document/application-document-code.entity';
import { ApplicationDocument } from '../../alcs/application/application-document/application-document.entity';
import { ApplicationDocumentService } from '../../alcs/application/application-document/application-document.service';
import { ApplicationService } from '../../alcs/application/application.service';
import { ApplicationSubmission } from '../application-submission/application-submission.entity';
import {
  ApplicationSubmissionReviewDto,
  UpdateApplicationSubmissionReviewDto,
} from './application-submission-review.dto';
import { ApplicationSubmissionReview } from './application-submission-review.entity';

@Injectable()
export class ApplicationSubmissionReviewService {
  constructor(
    @InjectRepository(ApplicationSubmissionReview)
    private applicationSubmissionReviewRepository: Repository<ApplicationSubmissionReview>,
    private applicationDocumentService: ApplicationDocumentService,
    private applicationService: ApplicationService,
    @InjectMapper('') private mapper: Mapper,
  ) {}

  getByFileNumber(fileNumber: string) {
    return this.applicationSubmissionReviewRepository.findOneOrFail({
      where: {
        applicationFileNumber: fileNumber,
      },
    });
  }

  async startReview(application: ApplicationSubmission) {
    const applicationReview = new ApplicationSubmissionReview({
      applicationFileNumber: application.fileNumber,
    });
    return await this.applicationSubmissionReviewRepository.save(
      applicationReview,
    );
  }

  async update(
    fileNumber: string,
    localGovernment: ApplicationLocalGovernment,
    updateDto: UpdateApplicationSubmissionReviewDto,
  ) {
    const applicationReview = await this.getByFileNumber(fileNumber);

    if (!applicationReview) {
      throw new ServiceNotFoundException('Failed to load application review');
    }

    applicationReview.localGovernmentFileNumber =
      updateDto.localGovernmentFileNumber ??
      applicationReview.localGovernmentFileNumber;

    applicationReview.firstName =
      updateDto.firstName !== undefined
        ? updateDto.firstName
        : applicationReview.firstName;
    applicationReview.lastName =
      updateDto.lastName !== undefined
        ? updateDto.lastName
        : applicationReview.lastName;
    applicationReview.position =
      updateDto.position !== undefined
        ? updateDto.position
        : applicationReview.position;
    applicationReview.department =
      updateDto.department !== undefined
        ? updateDto.department
        : applicationReview.department;
    applicationReview.phoneNumber =
      updateDto.phoneNumber !== undefined
        ? updateDto.phoneNumber
        : applicationReview.phoneNumber;
    applicationReview.email =
      updateDto.email !== undefined ? updateDto.email : applicationReview.email;

    applicationReview.isOCPDesignation =
      updateDto.isOCPDesignation !== undefined
        ? updateDto.isOCPDesignation
        : applicationReview.isOCPDesignation;
    applicationReview.OCPBylawName =
      updateDto.OCPBylawName !== undefined
        ? updateDto.OCPBylawName
        : applicationReview.OCPBylawName;
    applicationReview.OCPDesignation =
      updateDto.OCPDesignation !== undefined
        ? updateDto.OCPDesignation
        : applicationReview.OCPDesignation;
    applicationReview.OCPConsistent =
      updateDto.OCPConsistent !== undefined
        ? updateDto.OCPConsistent
        : applicationReview.OCPConsistent;

    applicationReview.isSubjectToZoning =
      updateDto.isSubjectToZoning !== undefined
        ? updateDto.isSubjectToZoning
        : applicationReview.isSubjectToZoning;
    applicationReview.zoningBylawName =
      updateDto.zoningBylawName !== undefined
        ? updateDto.zoningBylawName
        : applicationReview.zoningBylawName;
    applicationReview.zoningDesignation =
      updateDto.zoningDesignation !== undefined
        ? updateDto.zoningDesignation
        : applicationReview.zoningDesignation;
    applicationReview.zoningMinimumLotSize =
      updateDto.zoningMinimumLotSize !== undefined
        ? updateDto.zoningMinimumLotSize
        : applicationReview.zoningMinimumLotSize;
    applicationReview.isZoningConsistent =
      updateDto.isZoningConsistent !== undefined
        ? updateDto.isZoningConsistent
        : applicationReview.isZoningConsistent;

    applicationReview.isAuthorized =
      updateDto.isAuthorized !== undefined
        ? updateDto.isAuthorized
        : applicationReview.isAuthorized;

    if (
      applicationReview.isOCPDesignation == false &&
      applicationReview.isSubjectToZoning == false
    ) {
      applicationReview.isAuthorized = null;

      const applicationUuid = await this.applicationService.getUuid(
        applicationReview.applicationFileNumber,
      );

      await this.applicationDocumentService.deleteByType(
        DOCUMENT_TYPE.RESOLUTION_DOCUMENT,
        applicationUuid,
      );

      await this.applicationDocumentService.deleteByType(
        DOCUMENT_TYPE.STAFF_REPORT,
        applicationUuid,
      );
    }

    return this.applicationSubmissionReviewRepository.save(applicationReview);
  }

  verifyComplete(
    applicationReview: ApplicationSubmissionReview,
    documents: ApplicationDocument[],
    isFirstNationGovernment: boolean,
  ): ApplicationSubmissionReview {
    if (
      !applicationReview.localGovernmentFileNumber ||
      !applicationReview.firstName ||
      !applicationReview.lastName ||
      !applicationReview.position ||
      !applicationReview.department ||
      !applicationReview.phoneNumber ||
      !applicationReview.email
    ) {
      throw new BaseServiceException('Contact information not complete');
    }

    if (!isFirstNationGovernment) {
      if (applicationReview.isOCPDesignation === null) {
        throw new BaseServiceException('OCP information not complete');
      }

      if (applicationReview.isOCPDesignation) {
        if (
          !applicationReview.OCPBylawName ||
          !applicationReview.OCPDesignation ||
          applicationReview.OCPConsistent === null
        ) {
          throw new BaseServiceException('OCP information not complete');
        }
      }
    }

    if (!isFirstNationGovernment) {
      if (applicationReview.isSubjectToZoning === null) {
        throw new BaseServiceException('Zoning information not complete');
      }

      if (applicationReview.isSubjectToZoning) {
        if (
          !applicationReview.zoningBylawName ||
          !applicationReview.zoningDesignation ||
          !applicationReview.zoningMinimumLotSize ||
          applicationReview.isZoningConsistent === null
        ) {
          throw new BaseServiceException('Zoning information not complete');
        }
      }
    }

    if (
      (applicationReview.isOCPDesignation ||
        applicationReview.isSubjectToZoning) &&
      applicationReview.isAuthorized === null
    ) {
      throw new BaseServiceException('Review authorization needs to be set');
    }

    //Verify Documents
    if (
      applicationReview.isSubjectToZoning ||
      applicationReview.isOCPDesignation
    ) {
      if (
        !documents.some(
          (doc) => doc.type?.code === DOCUMENT_TYPE.RESOLUTION_DOCUMENT,
        )
      ) {
        throw new BaseServiceException('Review missing resolution document');
      }

      if (!isFirstNationGovernment && applicationReview.isAuthorized) {
        if (
          !documents.some(
            (doc) => doc.type?.code === DOCUMENT_TYPE.STAFF_REPORT,
          )
        ) {
          throw new BaseServiceException(
            'Review missing staff report document',
          );
        }
      }
    }
    return applicationReview;
  }

  async mapToDto(
    review: ApplicationSubmissionReview,
    localGovernment: ApplicationLocalGovernment,
  ): Promise<ApplicationSubmissionReviewDto> {
    const mappedReview = await this.mapper.mapAsync(
      review,
      ApplicationSubmissionReview,
      ApplicationSubmissionReviewDto,
    );
    return {
      ...mappedReview,
      isFirstNationGovernment: localGovernment.isFirstNation,
    };
  }

  async delete(applicationReview: ApplicationSubmissionReview) {
    await this.applicationSubmissionReviewRepository.remove(applicationReview);
  }
}

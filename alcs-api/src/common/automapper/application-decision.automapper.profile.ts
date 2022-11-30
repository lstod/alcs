import { createMap, forMember, mapFrom, Mapper } from '@automapper/core';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';
import { ApplicationDecisionMeetingDto } from '../../decision/application-decision-meeting/application-decision-meeting.dto';
import { ApplicationDecisionMeeting } from '../../decision/application-decision-meeting/application-decision-meeting.entity';
import { DecisionOutcomeCode } from '../../decision/application-decision/application-decision-outcome.entity';
import {
  ApplicationDecisionDto,
  DecisionDocumentDto,
  DecisionOutcomeCodeDto,
} from '../../decision/application-decision/application-decision.dto';
import { ApplicationDecision } from '../../decision/application-decision/application-decision.entity';
import { CeoCriterionCodeDto } from '../../decision/application-decision/ceo-criterion/ceo-criterion.dto';
import { CeoCriterionCode } from '../../decision/application-decision/ceo-criterion/ceo-criterion.entity';
import { DecisionDocument } from '../../decision/application-decision/decision-document.entity';
import { DecisionMakerCodeDto } from '../../decision/application-decision/decision-maker/decision-maker.dto';
import { DecisionMakerCode } from '../../decision/application-decision/decision-maker/decision-maker.entity';

@Injectable()
export class ApplicationDecisionProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper) => {
      createMap(
        mapper,
        ApplicationDecision,
        ApplicationDecisionDto,
        forMember(
          (ad) => ad.documents,
          mapFrom((a) =>
            this.mapper.mapArray(
              a.documents || [],
              DecisionDocument,
              DecisionDocumentDto,
            ),
          ),
        ),
        forMember(
          (a) => a.reconsiders,
          mapFrom((dec) =>
            dec.reconsiders
              ? {
                  uuid: dec.reconsiders.uuid,
                  linkedResolutions: dec.reconsiders.reconsidersDecisions.map(
                    (decision) =>
                      `#${decision.resolutionNumber}/${dec.resolutionYear}`,
                  ),
                }
              : undefined,
          ),
        ),
        forMember(
          (a) => a.modifies,
          mapFrom((dec) =>
            dec.modifies
              ? {
                  uuid: dec.modifies.uuid,
                  linkedResolutions: dec.modifies.modifiesDecisions.map(
                    (decision) =>
                      `#${decision.resolutionNumber}/${dec.resolutionYear}`,
                  ),
                }
              : undefined,
          ),
        ),
        forMember(
          (a) => a.reconsideredBy,
          mapFrom((dec) =>
            (dec.reconsideredBy || [])
              .filter((reconsideration) => reconsideration.resultingDecision)
              .map((reconsideration) => ({
                uuid: reconsideration.uuid,
                linkedResolutions: [
                  `#${reconsideration.resultingDecision!.resolutionNumber}/${
                    reconsideration.resultingDecision!.resolutionYear
                  }`,
                ],
              })),
          ),
        ),
        forMember(
          (a) => a.modifiedBy,
          mapFrom((dec) =>
            (dec.modifiedBy || [])
              .filter((modification) => modification.resultingDecision)
              .map((modification) => ({
                uuid: modification.uuid,
                linkedResolutions: [
                  `#${modification.resultingDecision!.resolutionNumber}/${
                    modification.resultingDecision!.resolutionYear
                  }`,
                ],
              })),
          ),
        ),
        forMember(
          (ad) => ad.decisionMaker,
          mapFrom((a) =>
            this.mapper.map(
              a.decisionMaker,
              DecisionMakerCode,
              DecisionMakerCodeDto,
            ),
          ),
        ),
        forMember(
          (ad) => ad.ceoCriterion,
          mapFrom((a) =>
            this.mapper.map(
              a.ceoCriterion,
              CeoCriterionCode,
              CeoCriterionCodeDto,
            ),
          ),
        ),
        forMember(
          (ad) => ad.isOther,
          mapFrom((a) => a.isOther),
        ),
        forMember(
          (ad) => ad.isTimeExtension,
          mapFrom((a) => a.isTimeExtension),
        ),
        forMember(
          (ad) => ad.auditDate,
          mapFrom((a) => (a.auditDate ? a.auditDate.getTime() : null)),
        ),
        forMember(
          (ad) => ad.chairReviewDate,
          mapFrom((a) =>
            a.chairReviewDate ? a.chairReviewDate.getTime() : null,
          ),
        ),
        forMember(
          (ad) => ad.chairReviewOutcome,
          mapFrom((a) => a.chairReviewOutcome),
        ),
      );

      createMap(mapper, DecisionOutcomeCode, DecisionOutcomeCodeDto);
      createMap(mapper, DecisionMakerCode, DecisionMakerCodeDto);
      createMap(mapper, CeoCriterionCode, CeoCriterionCodeDto);

      createMap(
        mapper,
        ApplicationDecisionMeeting,
        ApplicationDecisionMeetingDto,
      );
      createMap(
        mapper,
        ApplicationDecisionMeetingDto,
        ApplicationDecisionMeeting,
        forMember(
          (a) => a.date,
          mapFrom((ad) => new Date(ad.date)),
        ),
      );

      createMap(
        mapper,
        DecisionDocument,
        DecisionDocumentDto,
        forMember(
          (a) => a.mimeType,
          mapFrom((ad) => {
            return ad.document.mimeType;
          }),
        ),
        forMember(
          (a) => a.fileName,
          mapFrom((ad) => {
            return ad.document.fileName;
          }),
        ),
        forMember(
          (a) => a.uploadedBy,
          mapFrom((ad) => {
            return ad.document.uploadedBy.name;
          }),
        ),
        forMember(
          (a) => a.uploadedAt,
          mapFrom((ad) => {
            return ad.document.uploadedAt.getTime();
          }),
        ),
      );
    };
  }
}
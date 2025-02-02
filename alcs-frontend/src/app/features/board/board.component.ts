import { ComponentType } from '@angular/cdk/portal';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApplicationModificationDto } from '../../services/application/application-modification/application-modification.dto';
import { ApplicationModificationService } from '../../services/application/application-modification/application-modification.service';
import { ApplicationReconsiderationDto } from '../../services/application/application-reconsideration/application-reconsideration.dto';
import { ApplicationReconsiderationService } from '../../services/application/application-reconsideration/application-reconsideration.service';
import { ApplicationDto } from '../../services/application/application.dto';
import { ApplicationService } from '../../services/application/application.service';
import { BoardService, BoardWithFavourite } from '../../services/board/board.service';
import { CardService } from '../../services/card/card.service';
import { CovenantDto } from '../../services/covenant/covenant.dto';
import { CovenantService } from '../../services/covenant/covenant.service';
import { PlanningReviewDto } from '../../services/planning-review/planning-review.dto';
import { PlanningReviewService } from '../../services/planning-review/planning-review.service';
import { ToastService } from '../../services/toast/toast.service';
import {
  COVENANT_TYPE_LABEL,
  MODIFICATION_TYPE_LABEL,
  PLANNING_TYPE_LABEL,
  RECON_TYPE_LABEL,
} from '../../shared/application-type-pill/application-type-pill.constants';
import { CardData, CardSelectedEvent, CardType } from '../../shared/card/card.component';
import { DragDropColumn } from '../../shared/drag-drop-board/drag-drop-column.interface';
import { ApplicationDialogComponent } from './dialogs/application/application-dialog.component';
import { CreateApplicationDialogComponent } from './dialogs/application/create/create-application-dialog.component';
import { CovenantDialogComponent } from './dialogs/covenant/covenant-dialog.component';
import { CreateCovenantDialogComponent } from './dialogs/covenant/create/create-covenant-dialog.component';
import { CreateModificationDialogComponent } from './dialogs/modification/create/create-modification-dialog.component';
import { ModificationDialogComponent } from './dialogs/modification/modification-dialog.component';
import { CreatePlanningReviewDialogComponent } from './dialogs/planning-review/create/create-planning-review-dialog.component';
import { PlanningReviewDialogComponent } from './dialogs/planning-review/planning-review-dialog.component';
import { CreateReconsiderationDialogComponent } from './dialogs/reconsiderations/create/create-reconsideration-dialog.component';
import { ReconsiderationDialogComponent } from './dialogs/reconsiderations/reconsideration-dialog.component';

export const BOARD_TYPE_CODES = {
  VETT: 'vett',
  EXEC: 'exec',
  CEO: 'ceo',
};

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss'],
})
export class BoardComponent implements OnInit, OnDestroy {
  $destroy = new Subject<void>();
  cards: CardData[] = [];
  columns: DragDropColumn[] = [];
  boardTitle = '';
  boardIsFavourite: boolean = false;
  boardHasPlanningReviews: boolean = false;
  boardHasModifications: boolean = false;
  boardHasCovenant: boolean = false;
  createCardTitle = '';
  currentBoardCode: string = '';

  selectedBoardCode?: string;
  boards: BoardWithFavourite[] = [];
  cardDialogType: any = CreateApplicationDialogComponent;

  constructor(
    private applicationService: ApplicationService,
    private boardService: BoardService,
    public dialog: MatDialog,
    private toastService: ToastService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private cardService: CardService,
    private reconsiderationService: ApplicationReconsiderationService,
    private planningReviewService: PlanningReviewService,
    private modificationService: ApplicationModificationService,
    private covenantService: CovenantService,
    private titleService: Title
  ) {}

  ngOnInit() {
    this.activatedRoute.params.pipe(takeUntil(this.$destroy)).subscribe((params) => {
      const boardCode = params['boardCode'];
      if (boardCode) {
        this.selectedBoardCode = boardCode;
        const selectedBoard = this.boards.find((board) => board.code === this.selectedBoardCode);

        if (selectedBoard) {
          this.setupBoard(selectedBoard);
        }
        this.currentBoardCode = boardCode;
        this.setupCreateCardButton(boardCode);
      }
    });

    this.activatedRoute.queryParamMap.subscribe((queryParamMap) => {
      const app = queryParamMap.get('card');
      const type = queryParamMap.get('type');
      if (app && type) {
        this.openCardDialog({ uuid: app, cardType: type as CardType });
      }
    });

    this.boardService.$boards.pipe(takeUntil(this.$destroy)).subscribe((boards) => {
      this.boards = boards;
      const selectedBoard = boards.find((board) => board.code === this.selectedBoardCode);
      if (selectedBoard) {
        this.setupBoard(selectedBoard);
      }
    });
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async onSelected(card: CardSelectedEvent) {
    this.setUrl(card.uuid, card.cardType);
  }

  async onCreate() {
    this.openDialog(this.cardDialogType, {
      currentBoardCode: this.selectedBoardCode,
    });
  }

  async onReconsiderationCreate() {
    this.openDialog(CreateReconsiderationDialogComponent, {
      currentBoardCode: this.selectedBoardCode,
    });
  }

  onCreatePlanningReview() {
    this.openDialog(CreatePlanningReviewDialogComponent, {
      currentBoardCode: this.selectedBoardCode,
    });
  }

  onCreateModification() {
    this.openDialog(CreateModificationDialogComponent, {
      currentBoardCode: this.selectedBoardCode,
    });
  }

  onCreateCovenant() {
    this.openDialog(CreateCovenantDialogComponent, {
      currentBoardCode: this.selectedBoardCode,
    });
  }

  onDropped($event: { id: string; status: string; cardTypeCode: CardType }) {
    switch ($event.cardTypeCode) {
      case CardType.APP:
        this.applicationService
          .updateApplicationCard($event.id, {
            statusCode: $event.status,
          })
          .then((r) => {
            this.toastService.showSuccessToast('Application updated');
          });
        break;
      case CardType.RECON:
      case CardType.PLAN:
      case CardType.MODI:
      case CardType.COV:
        this.cardService
          .updateCard({
            uuid: $event.id,
            statusCode: $event.status,
          })
          .then((r) => {
            this.toastService.showSuccessToast('Card updated');
          });
        break;
      default:
        console.error('Card type is not configured for dropped event');
    }
  }

  private setupCreateCardButton(boardCode: string = '') {
    if (boardCode === BOARD_TYPE_CODES.VETT) {
      this.createCardTitle = '+ New Application';
      this.cardDialogType = CreateApplicationDialogComponent;
    }
  }

  private setupBoard(board: BoardWithFavourite) {
    this.titleService.setTitle(`${environment.siteName} | ${board.title} Board`);

    this.loadCards(board.code);
    this.boardTitle = board.title;
    this.boardIsFavourite = board.isFavourite;
    this.boardHasPlanningReviews = board.code === BOARD_TYPE_CODES.EXEC;
    this.boardHasModifications = board.code === BOARD_TYPE_CODES.CEO;
    this.boardHasCovenant = board.code !== BOARD_TYPE_CODES.VETT;
    const allStatuses = board.statuses.map((status) => status.statusCode);

    this.columns = board.statuses.map((status) => ({
      status: status.statusCode,
      name: status.label,
      allowedTransitions: allStatuses,
    }));
  }

  private async loadCards(boardCode: string) {
    const thingsWithCards = await this.boardService.fetchCards(boardCode);
    const mappedApps = thingsWithCards.applications.map(this.mapApplicationDtoToCard.bind(this));
    const mappedRecons = thingsWithCards.reconsiderations.map(this.mapReconsiderationDtoToCard.bind(this));
    const mappedReviewMeetings = thingsWithCards.planningReviews.map(this.mapPlanningReviewToCard.bind(this));
    const mappedModifications = thingsWithCards.modifications.map(this.mapModificationToCard.bind(this));
    const mappedCovenants = thingsWithCards.covenants.map(this.mapCovenantToCard.bind(this));
    if (boardCode === BOARD_TYPE_CODES.VETT) {
      this.cards = [...mappedApps, ...mappedRecons, ...mappedReviewMeetings, ...mappedCovenants].sort((a, b) => {
        if (a.highPriority === b.highPriority) {
          return b.dateReceived - a.dateReceived;
        }
        return b.highPriority ? 1 : -1;
      });
    } else {
      const sorted = [];
      sorted.push(
        // high priority
        ...mappedApps.filter((a) => a.highPriority).sort((a, b) => b.activeDays! - a.activeDays!),
        ...mappedModifications.filter((r) => r.highPriority).sort((a, b) => a.dateReceived - b.dateReceived),
        ...mappedRecons.filter((r) => r.highPriority).sort((a, b) => a.dateReceived - b.dateReceived),
        ...mappedReviewMeetings.filter((r) => r.highPriority).sort((a, b) => a.dateReceived - b.dateReceived),
        ...mappedCovenants.filter((r) => r.highPriority).sort((a, b) => a.dateReceived - b.dateReceived),
        // none high priority
        ...mappedApps.filter((a) => !a.highPriority).sort((a, b) => b.activeDays! - a.activeDays!),
        ...mappedModifications.filter((r) => !r.highPriority).sort((a, b) => a.dateReceived - b.dateReceived),
        ...mappedRecons.filter((r) => !r.highPriority).sort((a, b) => a.dateReceived - b.dateReceived),
        ...mappedReviewMeetings.filter((r) => !r.highPriority).sort((a, b) => a.dateReceived - b.dateReceived),
        ...mappedCovenants.filter((r) => !r.highPriority).sort((a, b) => a.dateReceived - b.dateReceived)
      );
      this.cards = sorted;
    }
  }

  private mapApplicationDtoToCard(application: ApplicationDto): CardData {
    return {
      status: application.card!.status.code,
      title: `${application.fileNumber} (${application.applicant})`,
      titleTooltip: application.applicant,
      assignee: application.card!.assignee,
      id: application.fileNumber,
      labels: [application.type],
      activeDays: application.activeDays,
      paused: application.paused,
      highPriority: application.card!.highPriority,
      decisionMeetings: application.decisionMeetings,
      cardType: CardType.APP,
      cardUuid: application.card!.uuid,
      dateReceived: application.dateSubmittedToAlc,
    };
  }

  private mapReconsiderationDtoToCard(recon: ApplicationReconsiderationDto): CardData {
    return {
      status: recon.card.status.code,
      title: `${recon.application.fileNumber} (${recon.application.applicant})`,
      titleTooltip: recon.application.applicant,
      assignee: recon.card.assignee,
      id: recon.card.uuid,
      labels: [recon.application.type, RECON_TYPE_LABEL],
      cardType: CardType.RECON,
      paused: false,
      highPriority: recon.card.highPriority,
      cardUuid: recon.card.uuid,
      decisionMeetings: recon.application.decisionMeetings,
      dateReceived: recon.submittedDate,
    };
  }

  private mapModificationToCard(modification: ApplicationModificationDto): CardData {
    return {
      status: modification.card.status.code,
      title: `${modification.application.fileNumber} (${modification.application.applicant})`,
      titleTooltip: modification.application.applicant,
      assignee: modification.card.assignee,
      id: modification.card.uuid,
      labels: [modification.application.type, MODIFICATION_TYPE_LABEL],
      cardType: CardType.MODI,
      paused: false,
      highPriority: modification.card.highPriority,
      cardUuid: modification.card.uuid,
      decisionMeetings: modification.application.decisionMeetings,
      dateReceived: modification.submittedDate,
    };
  }

  private mapPlanningReviewToCard(meeting: PlanningReviewDto): CardData {
    return {
      status: meeting.card.status.code,
      title: `${meeting.fileNumber} (${meeting.type})`,
      titleTooltip: meeting.type,
      assignee: meeting.card.assignee,
      id: meeting.card.uuid,
      labels: [PLANNING_TYPE_LABEL],
      cardType: CardType.PLAN,
      paused: false,
      highPriority: meeting.card.highPriority,
      cardUuid: meeting.card.uuid,
      dateReceived: meeting.card.createdAt,
    };
  }

  private mapCovenantToCard(covenant: CovenantDto): CardData {
    return {
      status: covenant.card.status.code,
      title: `${covenant.fileNumber} (${covenant.applicant})`,
      titleTooltip: covenant.applicant,
      assignee: covenant.card.assignee,
      id: covenant.card.uuid,
      labels: [COVENANT_TYPE_LABEL],
      cardType: CardType.COV,
      paused: false,
      highPriority: covenant.card.highPriority,
      cardUuid: covenant.card.uuid,
      dateReceived: covenant.card.createdAt,
    };
  }

  private openDialog(component: ComponentType<any>, data: any) {
    const dialogRef = this.dialog.open(component, {
      minWidth: '600px',
      maxWidth: '900px',
      maxHeight: '80vh',
      width: '90%',
      data,
    });

    dialogRef.afterClosed().subscribe((isDirty) => {
      this.setUrl();

      if (isDirty && this.selectedBoardCode) {
        this.loadCards(this.selectedBoardCode);
      }
    });
  }

  private setUrl(cardUuid?: string, cardTypeCode?: CardType) {
    this.router.navigate(this.activatedRoute.snapshot.url, {
      queryParams: cardUuid && cardTypeCode ? { card: cardUuid, type: cardTypeCode } : {},
      relativeTo: this.activatedRoute,
    });
  }

  private async openCardDialog(card: CardSelectedEvent) {
    try {
      switch (card.cardType) {
        case CardType.APP:
          const application = await this.applicationService.fetchByCardUuid(card.uuid);
          this.openDialog(ApplicationDialogComponent, application);
          break;
        case CardType.RECON:
          const recon = await this.reconsiderationService.fetchByCardUuid(card.uuid);
          this.openDialog(ReconsiderationDialogComponent, recon);
          break;
        case CardType.PLAN:
          const planningReview = await this.planningReviewService.fetchByCardUuid(card.uuid);
          this.openDialog(PlanningReviewDialogComponent, planningReview);
          break;
        case CardType.MODI:
          const modification = await this.modificationService.fetchByCardUuid(card.uuid);
          this.openDialog(ModificationDialogComponent, modification);
          break;
        case CardType.COV:
          const covenant = await this.covenantService.fetchByCardUuid(card.uuid);
          this.openDialog(CovenantDialogComponent, covenant);
          break;
        default:
          console.error('Card type is not configured for a dialog');
          this.toastService.showErrorToast('Failed to open card');
      }
    } catch (err) {
      this.toastService.showErrorToast('There was an issue loading the card, please try again');
      console.error(err);
    }
  }
}

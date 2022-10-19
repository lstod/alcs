import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { ApplicationDto, UpdateApplicationDto } from '../../../../services/application/application.dto';
import { ApplicationService } from '../../../../services/application/application.service';
import { BoardStatusDto } from '../../../../services/board/board.dto';
import { BoardService, BoardWithFavourite } from '../../../../services/board/board.service';
import { ToastService } from '../../../../services/toast/toast.service';
import { UserDto } from '../../../../services/user/user.dto';
import { UserService } from '../../../../services/user/user.service';
import { ConfirmationDialogService } from '../../../../shared/confirmation-dialog/confirmation-dialog.service';

@Component({
  selector: 'app-detail-dialog',
  templateUrl: './application-dialog.component.html',
  styleUrls: ['./application-dialog.component.scss'],
})
export class ApplicationDialogComponent implements OnInit, OnDestroy {
  $destroy = new Subject<void>();
  $users: Observable<UserDto[]> | undefined;
  selectedAssignee?: UserDto;
  selectedAssigneeName?: string;
  selectedApplicationStatus = '';
  selectedBoard?: string;
  selectedRegion?: string;

  application: ApplicationDto = this.data;
  boardStatuses: BoardStatusDto[] = [];
  boards: BoardWithFavourite[] = [];

  isApplicationDirty = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ApplicationDto,
    private dialogRef: MatDialogRef<ApplicationDialogComponent>,
    private userService: UserService,
    private applicationService: ApplicationService,
    private boardService: BoardService,
    private toastService: ToastService,
    private confirmationDialogService: ConfirmationDialogService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.populateData(this.data);

    this.$users = this.userService.$users;
    this.userService.fetchUsers();

    this.boardService.$boards.pipe(takeUntil(this.$destroy)).subscribe((boards) => {
      this.boards = boards;
      const loadedBoard = boards.find((board) => board.code === this.selectedBoard);
      if (loadedBoard) {
        this.boardStatuses = loadedBoard.statuses;
      }
    });

    this.dialogRef.backdropClick().subscribe(() => {
      this.dialogRef.close(this.isApplicationDirty);
    });
  }

  populateData(application: ApplicationDto) {
    this.application = application;
    this.selectedAssignee = application.card.assignee;
    this.selectedAssigneeName = this.selectedAssignee?.name;
    this.selectedApplicationStatus = application.card.status.code;
    this.selectedBoard = application.card.board.code;
    this.selectedRegion = application.region.code;
  }

  filterAssigneeList(term: string, item: UserDto) {
    const termLower = term.toLocaleLowerCase();
    return (
      item.email.toLocaleLowerCase().indexOf(termLower) > -1 || item.name.toLocaleLowerCase().indexOf(termLower) > -1
    );
  }

  onAssigneeSelected(assignee: UserDto) {
    this.selectedAssignee = assignee;
    this.application.card.assignee = assignee;
    this.updateCard({
      assigneeUuid: assignee?.uuid ?? null,
    });
  }

  onStatusSelected(applicationStatus: BoardStatusDto) {
    this.selectedApplicationStatus = applicationStatus.statusCode;
    this.updateCard({
      statusCode: applicationStatus.statusCode,
    });
  }

  async onBoardSelected(board: BoardWithFavourite) {
    this.selectedBoard = board.code;
    try {
      await this.boardService.changeBoard(this.application.card.uuid, board.code);
      const loadedBoard = this.boards.find((board) => board.code === this.selectedBoard);
      if (loadedBoard) {
        this.boardStatuses = loadedBoard.statuses;
      }

      this.isApplicationDirty = true;
      const toast = this.toastService.showSuccessToast(`Application moved to ${board.title}`, 'Go to Board');
      toast.onAction().subscribe(() => {
        this.router.navigate(['/board', board.code]);
      });
      await this.reloadApplication();
    } catch (e) {
      this.toastService.showErrorToast('Failed to move to new board');
    }
  }

  async reloadApplication() {
    const application = await this.applicationService.fetchApplication(this.application.fileNumber);
    this.populateData(application);
  }

  updateCard(updates: UpdateApplicationDto) {
    this.applicationService.updateApplicationCard(this.data.card.uuid, updates).then(() => {
      this.isApplicationDirty = true;
      this.toastService.showSuccessToast('Application updated');
    });
  }

  onTogglePriority() {
    const answer = this.confirmationDialogService.openDialog({
      body: this.application.card.highPriority ? 'Remove priority from this card?' : 'Add priority to this card?',
    });
    answer.subscribe((answer) => {
      if (answer) {
        this.applicationService
          .updateApplicationCard(this.application.card.uuid, {
            highPriority: !this.application.card.highPriority,
          })
          .then(() => {
            this.isApplicationDirty = true;
            this.application.card.highPriority = !this.application.card.highPriority;
            this.toastService.showSuccessToast(
              this.application.card.highPriority ? 'Priority added' : 'Priority removed'
            );
          });
      }
    });
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }
}

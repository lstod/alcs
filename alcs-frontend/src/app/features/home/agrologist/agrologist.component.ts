import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { ROLES } from '../../../services/authentication/authentication.service';
import { CARD_SUBTASK_TYPE, HomepageSubtaskDto } from '../../../services/card/card-subtask/card-subtask.dto';
import { CardSubtaskService } from '../../../services/card/card-subtask/card-subtask.service';
import { HomeService } from '../../../services/home/home.service';
import { AssigneeDto, UserDto } from '../../../services/user/user.dto';
import { UserService } from '../../../services/user/user.service';
import {
  COVENANT_TYPE_LABEL,
  MODIFICATION_TYPE_LABEL,
  PLANNING_TYPE_LABEL,
  RECON_TYPE_LABEL,
} from '../../../shared/application-type-pill/application-type-pill.constants';
import { CardType } from '../../../shared/card/card.component';

@Component({
  selector: 'app-agro-subtasks',
  templateUrl: './agrologist.component.html',
  styleUrls: ['./agrologist.component.scss'],
})
export class AgrologistComponent implements OnInit {
  subtasks: MatTableDataSource<HomepageSubtaskDto> = new MatTableDataSource();
  public agrologistUsers: AssigneeDto[] = [];
  displayedColumns = ['highPriority', 'title', 'type', 'activeDays', 'stage', 'assignee', 'action'];

  MODIFICATION_LABEL = MODIFICATION_TYPE_LABEL;
  RECONSIDERATION_LABEL = RECON_TYPE_LABEL;
  COVENANT_LABEL = COVENANT_TYPE_LABEL;
  PLANNING_REVIEW_LABEL = PLANNING_TYPE_LABEL;

  constructor(
    private homeService: HomeService,
    private userService: UserService,
    private router: Router,
    private cardSubtaskService: CardSubtaskService
  ) {}

  ngOnInit(): void {
    this.userService.$assignableUsers.subscribe((users) => {
      this.agrologistUsers = users.filter((user) => user.clientRoles.includes(ROLES.AGROLOGIST));
    });
    this.userService.fetchAssignableUsers();

    this.loadSubtasks();
  }

  private async loadSubtasks() {
    const nonOrderedSubtasks = await this.homeService.fetchSubtasks(CARD_SUBTASK_TYPE.AGROLOGIST);
    const applications = nonOrderedSubtasks.filter((s) => s.card.type === CardType.APP);
    const reconsiderations = nonOrderedSubtasks.filter((s) => s.card.type === CardType.RECON);
    const planningReviews = nonOrderedSubtasks.filter((s) => s.card.type === CardType.PLAN);
    const modifications = nonOrderedSubtasks.filter((s) => s.card.type === CardType.MODI);
    const covenants = nonOrderedSubtasks.filter((s) => s.card.type === CardType.COV);

    const sortedSubtasks = [
      // high priority
      ...applications.filter((a) => a.card.highPriority).sort((a, b) => b.activeDays! - a.activeDays!),
      ...modifications.filter((r) => r.card.highPriority).sort((a, b) => a.createdAt! - b.createdAt!),
      ...reconsiderations.filter((r) => r.card.highPriority).sort((a, b) => a.createdAt! - b.createdAt!),
      ...planningReviews.filter((r) => r.card.highPriority).sort((a, b) => a.createdAt! - b.createdAt!),
      ...covenants.filter((r) => r.card.highPriority).sort((a, b) => a.createdAt! - b.createdAt!),
      // none high priority
      ...applications.filter((a) => !a.card.highPriority).sort((a, b) => b.activeDays! - a.activeDays!),
      ...modifications.filter((r) => !r.card.highPriority).sort((a, b) => a.createdAt! - b.createdAt!),
      ...reconsiderations.filter((r) => !r.card.highPriority).sort((a, b) => a.createdAt! - b.createdAt!),
      ...planningReviews.filter((r) => !r.card.highPriority).sort((a, b) => a.createdAt! - b.createdAt!),
      ...covenants.filter((r) => !r.card.highPriority).sort((a, b) => a.createdAt! - b.createdAt!),
    ];
    this.subtasks = new MatTableDataSource(sortedSubtasks);
  }

  filterAssigneeList(term: string, item: AssigneeDto) {
    const termLower = term.toLocaleLowerCase();
    return (
      item.email.toLocaleLowerCase().indexOf(termLower) > -1 ||
      item.prettyName.toLocaleLowerCase().indexOf(termLower) > -1
    );
  }

  openCard(subtask: HomepageSubtaskDto) {
    this.router.navigateByUrl(`/board/${subtask.card.board.code}?card=${subtask.card.uuid}&type=${subtask.card.type}`);
  }

  async onAssigneeSelected(assignee: UserDto, uuid: string) {
    await this.cardSubtaskService.update(uuid, { assignee: assignee ? assignee.uuid : null });
  }
}
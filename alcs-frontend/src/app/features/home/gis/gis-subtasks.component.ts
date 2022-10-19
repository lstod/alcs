import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CardStatusDto } from '../../../services/application/application-code.dto';
import { ApplicationSubtaskWithApplicationDto } from '../../../services/application/application-subtask/application-subtask.dto';
import { ApplicationSubtaskService } from '../../../services/application/application-subtask/application-subtask.service';
import { ApplicationService } from '../../../services/application/application.service';
import { HomeService } from '../../../services/home/home.service';
import { UserDto } from '../../../services/user/user.dto';
import { UserService } from '../../../services/user/user.service';

@Component({
  selector: 'app-gis-subtasks',
  templateUrl: './gis-subtasks.component.html',
  styleUrls: ['./gis-subtasks.component.scss'],
})
export class GisSubtasksComponent implements OnInit {
  subtasks: ApplicationSubtaskWithApplicationDto[] = [];
  private statuses: CardStatusDto[] = [];
  public gisUsers: UserDto[] = [];

  constructor(
    private homeService: HomeService,
    private applicationService: ApplicationService,
    private userService: UserService,
    private router: Router,
    private applicationSubtaskService: ApplicationSubtaskService
  ) {}

  ngOnInit(): void {
    this.applicationService.$cardStatuses.subscribe((statuses) => {
      this.statuses = statuses;
    });

    this.userService.$users.subscribe((users) => {
      this.gisUsers = users.filter((user) => user.clientRoles.includes('GIS'));
    });
    this.userService.fetchUsers();

    this.loadSubtasks();
  }

  private async loadSubtasks() {
    const subtasks = await this.homeService.fetchGisSubtasks();

    this.subtasks = this.getMappedApplicationSubtasks(subtasks);

    const reconsiderationSubtasks = this.getMappedReconsiderationSubtasks(subtasks);
    this.subtasks.push(...reconsiderationSubtasks);

    this.subtasks.sort((a, b) => {
      if (a.application.card.highPriority === b.application.card.highPriority) {
        return b.application.activeDays - a.application.activeDays;
      }
      if (a.application.card.highPriority) {
        return -1;
      } else {
        return 1;
      }
    });
  }

  private getMappedApplicationSubtasks(subtasks: ApplicationSubtaskWithApplicationDto[]) {
    return subtasks
      .filter((subtask) => subtask.application)
      .map((subtask) => {
        const userDto = this.gisUsers.find((user) => user.uuid === subtask.assignee);
        return {
          ...subtask,
          assignee: userDto ? userDto.name : undefined,
          application: {
            ...subtask.application,
          },
        };
      });
  }

  private getMappedReconsiderationSubtasks(subtasks: ApplicationSubtaskWithApplicationDto[]) {
    return subtasks
      .filter((subtask) => subtask.reconsideration)
      .map((subtask) => {
        const statusDto = this.statuses.find((status) => status.code === subtask.reconsideration.card.status.code);
        const userDto = this.gisUsers.find((user) => user.uuid === subtask.assignee);
        return {
          ...subtask,
          assignee: userDto ? userDto.name : undefined,
          application: {
            ...(subtask.reconsideration.application as any),
            status: statusDto!.label,
            card: {
              ...subtask.reconsideration.card,
            },
          },
        };
      });
  }

  filterAssigneeList(term: string, item: UserDto) {
    const termLower = term.toLocaleLowerCase();
    return (
      item.email.toLocaleLowerCase().indexOf(termLower) > -1 || item.name.toLocaleLowerCase().indexOf(termLower) > -1
    );
  }

  openCard(fileNumber: string, boardCode: string, cardType: string) {
    this.router.navigateByUrl(`/board/${boardCode}?app=${fileNumber}&&type=${cardType}`);
  }

  async onAssigneeSelected(assignee: UserDto, uuid: string) {
    await this.applicationSubtaskService.update(uuid, { assignee: assignee ? assignee.uuid : null });
  }
}

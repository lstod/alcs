import { Component, OnInit } from '@angular/core';
import { combineLatestWith, tap } from 'rxjs';
import { ApplicationDetailService } from '../../../services/application/application-detail.service';
import { ApplicationMeetingDto } from '../../../services/application/application-meeting/application-meeting.dto';
import { ApplicationMeetingService } from '../../../services/application/application-meeting/application-meeting.service';
import { ApplicationDetailedDto, ApplicationDto } from '../../../services/application/application.dto';
import { TimelineEvent } from '../../../shared/timeline/timeline.component';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss'],
})
export class OverviewComponent implements OnInit {
  private application?: ApplicationDetailedDto;
  public events: TimelineEvent[] = [];

  constructor(
    private applicationDetailService: ApplicationDetailService,
    private meetingService: ApplicationMeetingService
  ) {}

  ngOnInit(): void {
    this.applicationDetailService.$application
      .pipe(
        tap((app) => {
          if (app) {
            this.meetingService.fetch(app.fileNumber);
          }
        })
      )
      .pipe(combineLatestWith(this.meetingService.$meetings))
      .subscribe(([application, meetings]) => {
        if (application) {
          this.application = application;
          this.events = this.mapApplicationToEvents(application, meetings);
        }
      });
  }

  mapApplicationToEvents(application: ApplicationDto, meetings: ApplicationMeetingDto[]): TimelineEvent[] {
    const editLink = new Map<string, string>([
      ['IR', './info-request'],
      ['AM', './site-visit-meeting'],
      ['SV', './site-visit-meeting'],
    ]);

    const mappedEvents: TimelineEvent[] = [];
    if (application.dateReceived) {
      mappedEvents.push({
        name: 'Submitted to ALC',
        startDate: new Date(application.dateReceived),
        isFulfilled: true,
      });
    }

    if (application.dateAcknowledgedIncomplete) {
      mappedEvents.push({
        name: 'Acknowledged Incomplete',
        startDate: new Date(application.dateAcknowledgedIncomplete),
        isFulfilled: true,
      });
    }

    if (application.dateAcknowledgedComplete) {
      mappedEvents.push({
        name: 'Acknowledged Complete',
        startDate: new Date(application.dateAcknowledgedComplete),
        isFulfilled: true,
      });
    }

    if (application.decisionMeetings.length) {
      const events: TimelineEvent[] = application.decisionMeetings.map((meeting, index) => ({
        name: application.decisionMeetings.length === 1 ? `Decision Meeting` : `Decision Meeting #${index + 1}`,
        startDate: new Date(meeting.date),
        isFulfilled: true,
      }));
      mappedEvents.push(...events);
    }

    if (application.decisionDate) {
      mappedEvents.push({
        name: 'Decision Made',
        startDate: new Date(application.decisionDate),
        isFulfilled: true,
      });
    }

    meetings.sort((a, b) => a.meetingStartDate - b.meetingStartDate);
    const typeCount = new Map<string, number>();
    meetings.forEach((meeting) => {
      const count = typeCount.get(meeting.meetingType.code) || 0;

      mappedEvents.push({
        name: `${meeting.meetingType.label} #${count + 1} Requested`,
        startDate: new Date(meeting.meetingStartDate),
        fulfilledDate: meeting.meetingEndDate ? new Date(meeting.meetingEndDate) : undefined,
        isFulfilled: !!meeting.meetingEndDate,
        link: editLink.get(meeting.meetingType.code),
      });

      if (meeting.reportStartDate) {
        mappedEvents.push({
          name: `${meeting.meetingType.label} #${count + 1} Sent to Applicant`,
          startDate: new Date(meeting.reportStartDate),
          fulfilledDate: meeting.reportEndDate ? new Date(meeting.reportEndDate) : undefined,
          isFulfilled: !!meeting.reportEndDate,
          link: editLink.get(meeting.meetingType.code),
        });
      }

      typeCount.set(meeting.meetingType.code, count + 1);
    });

    mappedEvents.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

    return mappedEvents;
  }
}
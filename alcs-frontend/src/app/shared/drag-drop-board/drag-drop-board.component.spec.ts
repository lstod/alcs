import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastService } from '../../services/toast/toast.service';
import { AssigneeDto } from '../../services/user/user.dto';
import { CardData, CardType } from '../card/card.component';

import { DragDropBoardComponent } from './drag-drop-board.component';
import { StatusFilterPipe } from './status-filter.pipe';

describe('DragDropBoardComponent', () => {
  let component: DragDropBoardComponent;
  let fixture: ComponentFixture<DragDropBoardComponent>;
  const mockCard: CardData = {
    id: '1',
    status: 'status',
    assignee: {
      name: 'Name',
      initials: 'initials',
    } as AssigneeDto,
    title: 'Im Title',
    titleTooltip: 'tooltip',
    activeDays: 2,
    paused: false,
    highPriority: true,
    decisionMeetings: [],
    cardUuid: 'fake',
    cardType: CardType.APP,
    dateReceived: 11111,
    labels: [
      {
        textColor: '#000',
        shortLabel: 'LUP',
        backgroundColor: '#fff',
        label: 'LUP',
      },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: ToastService, useValue: {} }],
      declarations: [DragDropBoardComponent, StatusFilterPipe],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DragDropBoardComponent);
    component = fixture.componentInstance;
    component.columns = [
      {
        status: 'status',
        name: 'Status',
        allowedTransitions: [],
      },
    ];
  });

  it('should render a single card when passed one', () => {
    component.cards = [mockCard];
    fixture.detectChanges();

    const compiled = fixture.debugElement.nativeElement;
    const column = compiled.querySelector('#column-status');
    expect(column).toBeTruthy();
    expect(column.querySelectorAll('app-card').length).toEqual(1);
    expect(compiled.querySelector('#card-1')).toBeTruthy();
  });

  it('should render two card when passed two', () => {
    component.cards = [
      mockCard,
      {
        ...mockCard,
        id: '2',
      },
    ];
    fixture.detectChanges();

    const compiled = fixture.debugElement.nativeElement;
    const column = compiled.querySelector('#column-status');
    expect(column).toBeTruthy();
    expect(column.querySelectorAll('app-card').length).toEqual(2);
    expect(compiled.querySelector('#card-1')).toBeTruthy();
    expect(compiled.querySelector('#card-2')).toBeTruthy();
  });
});

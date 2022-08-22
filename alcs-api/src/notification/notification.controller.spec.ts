import { createMock, DeepMocked } from '@golevelup/nestjs-testing';
import { Test, TestingModule } from '@nestjs/testing';
import { ClsService } from 'nestjs-cls';
import { mockKeyCloakProviders } from '../common/utils/test-helpers/mockTypes';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { Notification } from './notification.entity';

describe('NotificationController', () => {
  let controller: NotificationController;
  let notificationService: DeepMocked<NotificationService>;

  beforeEach(async () => {
    notificationService = createMock<NotificationService>();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: ClsService,
          useValue: {},
        },
        {
          provide: NotificationService,
          useValue: notificationService,
        },
        ...mockKeyCloakProviders,
      ],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call list for getAll', async () => {
    notificationService.list.mockResolvedValue([]);

    const res = await controller.getMyNotifications({
      user: {
        entity: {
          uuid: 'fake-user',
        },
      },
    });

    expect(res).toEqual([]);
    expect(notificationService.list).toHaveBeenCalled();
    expect(notificationService.list.mock.calls[0][0]).toEqual('fake-user');
  });

  it('should default list to empty array when no user', async () => {
    notificationService.list.mockResolvedValue([]);

    const res = await controller.getMyNotifications({
      user: { entity: {} },
    });

    expect(res).toEqual([]);
    expect(notificationService.list).not.toHaveBeenCalled();
  });

  it('should call into service for markReadAll', async () => {
    notificationService.markAllRead.mockResolvedValue(undefined);

    await controller.markAllRead({
      user: {
        entity: {
          uuid: 'fake-user',
        },
      },
    });

    expect(notificationService.markAllRead).toHaveBeenCalled();
    expect(notificationService.markAllRead.mock.calls[0][0]).toEqual(
      'fake-user',
    );
  });

  it('should call into service for markRead', async () => {
    notificationService.get.mockResolvedValue({} as Notification);
    notificationService.markRead.mockResolvedValue(undefined);

    await controller.markRead(
      {
        user: {
          entity: {
            uuid: 'fake-user',
          },
        },
      },
      'fake-notification',
    );

    expect(notificationService.markRead).toHaveBeenCalled();
    expect(notificationService.markRead.mock.calls[0][0]).toEqual(
      'fake-notification',
    );
  });

  it('should throw an exception when notification is not found', async () => {
    notificationService.get.mockResolvedValue(undefined);
    notificationService.markRead.mockResolvedValue(undefined);

    await expect(
      controller.markRead(
        {
          user: {
            entity: {
              uuid: 'fake-user',
            },
          },
        },
        'fake-notification',
      ),
    ).rejects.toMatchObject(new Error(`Failed to find notification`));

    expect(notificationService.markRead).not.toHaveBeenCalled();
  });
});

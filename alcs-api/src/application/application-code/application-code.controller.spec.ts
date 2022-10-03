import { classes } from '@automapper/classes';
import { AutomapperModule } from '@automapper/nestjs';
import { createMock } from '@golevelup/nestjs-testing';
import { Test, TestingModule } from '@nestjs/testing';
import { ClsService } from 'nestjs-cls';
import { mockKeyCloakProviders } from '../../common/utils/test-helpers/mockTypes';
import { ApplicationCodeController } from './application-code.controller';
import { ApplicationCodeService } from './application-code.service';

describe('ApplicationCodeController', () => {
  let controller: ApplicationCodeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        AutomapperModule.forRoot({
          strategyInitializer: classes(),
        }),
      ],
      controllers: [ApplicationCodeController],
      providers: [
        {
          provide: ApplicationCodeService,
          useValue: createMock<ApplicationCodeService>(),
        },
        {
          provide: ClsService,
          useValue: {},
        },
        ...mockKeyCloakProviders,
      ],
    }).compile();

    controller = module.get<ApplicationCodeController>(
      ApplicationCodeController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
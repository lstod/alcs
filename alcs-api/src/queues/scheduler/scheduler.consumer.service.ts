import { Process, Processor } from '@nestjs/bull';
import { Inject, Logger } from '@nestjs/common';
import * as dayjs from 'dayjs';
import {
  ApplicationService,
  APPLICATION_EXPIRATION_DAY_RANGES,
} from '../../application/application.service';
import { CONFIG_TOKEN, IConfig } from '../../common/config/config.module';
import { EmailService } from '../../providers/email/email.service';

@Processor('SchedulerQueue')
export class SchedulerConsumerService {
  private logger = new Logger(SchedulerConsumerService.name);

  constructor(
    private applicationService: ApplicationService,
    private emailService: EmailService,
    @Inject(CONFIG_TOKEN) private config: IConfig,
  ) {}

  @Process()
  async applicationExpiry() {
    this.logger.debug('starting applicationExpiry');

    const applicationsToProcess = await this.getApplicationsNearExpiryDates();

    if (applicationsToProcess && applicationsToProcess.length > 0) {
      const applicationsNumbers = applicationsToProcess.map(
        (ap) => ap.fileNumber,
      );
      // TODO: this will be refactored once we have the templating engine
      const body = `
      <p>Following applications near expiration:</p>
      ${applicationsNumbers.join('<br/>')}`;

      await this.emailService.sendEmail({
        to: this.config.get<string[]>('EMAIL.DEFAULT_ADMINS'),
        body: body,
        subject: 'Applications near expiry',
      });
    } else {
      this.logger.log(`No applications to report on ${Date.now()}`);
    }

    this.logger.debug('applicationExpiry complete');
    return;
  }

  private getApplicationsNearExpiryDates() {
    const startDate = dayjs().add(-90, 'day');
    const endDate = dayjs().add(
      -APPLICATION_EXPIRATION_DAY_RANGES.ACTIVE_DAYS_START,
      'day',
    );

    return this.applicationService.getApplicationsNearExpiryDates(
      startDate.toDate(),
      endDate.toDate(),
    );
  }
}
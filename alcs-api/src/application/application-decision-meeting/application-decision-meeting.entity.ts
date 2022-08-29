import { AutoMap } from '@automapper/classes';
import { Column, CreateDateColumn, Entity, ManyToOne } from 'typeorm';
import { Base } from '../../common/entities/base.entity';
import { Application } from '../application.entity';

@Entity()
export class ApplicationDecisionMeeting extends Base {
  constructor(data?: Partial<ApplicationDecisionMeeting>) {
    super();
    if (data) {
      Object.assign(this, data);
    }
  }

  @AutoMap()
  @CreateDateColumn({ type: 'timestamptz' })
  date: Date;

  @AutoMap()
  @Column()
  applicationUuid: string;

  @AutoMap()
  @ManyToOne(() => Application)
  application: Application;
}
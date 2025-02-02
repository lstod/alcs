import { AutoMap } from '@automapper/classes';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class EmailStatus extends BaseEntity {
  constructor(data?: Partial<EmailStatus>) {
    super();
    if (data) {
      Object.assign(this, data);
    }
  }

  @AutoMap()
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @CreateDateColumn({ type: 'timestamptz' })
  sentAt: Date;

  @Column({
    nullable: true,
    comment: 'Transaction ID returned by CHES',
  })
  transactionId: string;

  @Column()
  recipients: string;

  @Column()
  status: string;

  @Column({ nullable: true, type: 'text' })
  errors?: string;
}

import { BaseTableEntity } from 'src/common/entity/base-table.entity';
import { User } from 'src/user/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

export enum NotificationType {
  AGREE,
  DISAGREE,
  APPROVED,
  REJECTED,
  WARN,
  PROPOSAL,
}

@Entity()
export class Notification extends BaseTableEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  content: string;

  @Column({ default: NotificationType.WARN })
  type: NotificationType;

  @ManyToOne(() => User, (user) => user.id, {
    cascade: true,
    nullable: true,
    onDelete: 'CASCADE',
  })
  user: User;

  @Column({ nullable: true })
  redirectUrl: string;
}

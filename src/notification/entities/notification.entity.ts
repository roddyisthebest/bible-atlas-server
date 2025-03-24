import { User } from 'src/user/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

export enum NotificationType {
  AGREE,
  DISAGREE,
  APPROVED,
  REJECTED,
  WARN,
}

@Entity()
export class Notification {
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
    nullable: false,
    onDelete: 'CASCADE',
  })
  user: User;
}

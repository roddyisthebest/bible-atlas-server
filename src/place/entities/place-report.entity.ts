import { BaseTableEntity } from 'src/common/entity/base-table.entity';
import { User } from 'src/user/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
export enum ReportType {
  SPAM,
  INAPPROPRIATE,
  HATE_SPEECH,
  HARASSMENT,
  FALSE_INFORMATION,
  PERSONAL_INFO,
  ETC,
}

@Entity()
export class PlaceReport extends BaseTableEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ enum: ReportType, default: ReportType.FALSE_INFORMATION })
  type: ReportType;

  @Column({ nullable: true })
  reason: string;

  @ManyToOne(() => User, (user) => user.id, {
    cascade: true,
    nullable: false,
    onDelete: 'CASCADE',
  })
  creator: User;
}

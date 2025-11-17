import { BaseTableEntity } from 'src/common/entity/base-table.entity';
import { User } from 'src/user/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

export enum ReportType {
  BUG_REPORT = 'BUG_REPORT',
  FEATURE_REQUEST = 'FEATURE_REQUEST',
  UI_UX_ISSUE = 'UI_UX_ISSUE',
  PERFORMANCE_ISSUE = 'PERFORMANCE_ISSUE',
  DATA_ERROR = 'DATA_ERROR',
  LOGIN_ISSUE = 'LOGIN_ISSUE',
  SEARCH_ISSUE = 'SEARCH_ISSUE',
  MAP_ISSUE = 'MAP_ISSUE',
  GENERAL_FEEDBACK = 'GENERAL_FEEDBACK',
  OTHER = 'OTHER',
}

@Entity()
export class Report extends BaseTableEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ enum: ReportType, default: ReportType.GENERAL_FEEDBACK })
  type: ReportType;

  @Column({ nullable: true })
  comment: string;

  @ManyToOne(() => User, (user) => user.id, {
    cascade: true,
    nullable: true,
    onDelete: 'CASCADE',
  })
  creator: User;
}

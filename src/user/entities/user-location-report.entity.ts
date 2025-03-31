import {
  Column,
  Entity,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { ReportType } from './user-proposal-report.entity';
import { Location } from 'src/location/entities/location.entity';
import { BaseTableEntity } from 'src/common/entity/base-table.entity';

@Entity()
export class UserLocationReport extends BaseTableEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'userId',
    type: 'int8',
  })
  @ManyToOne(() => User, (user) => user.locationReports)
  user: User;

  @Column({
    name: 'locationId',
    type: 'int8',
  })
  @ManyToOne(() => Location, (location) => location.reports)
  location: Location;

  @Column({ default: ReportType.FALSE_INFORMATION })
  type: ReportType;

  @Column({ nullable: true })
  reason: string;
}

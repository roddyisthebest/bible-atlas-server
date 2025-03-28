import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';
import { ReportType } from './user-proposal-report.entity';
import { Location } from 'src/location/entities/location.entity';

@Entity()
export class UserLocationReport {
  @PrimaryColumn({
    name: 'userId',
    type: 'int8',
  })
  @ManyToOne(() => User, (user) => user.locationReports)
  user: User;

  @PrimaryColumn({
    name: 'location',
    type: 'int8',
  })
  @ManyToOne(() => Location, (location) => location.reports)
  location: Location;

  @Column({ default: ReportType.FALSE_INFORMATION })
  type: ReportType;

  @Column()
  reason: string;
}

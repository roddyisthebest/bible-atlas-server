import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Location } from 'src/location/entities/location.entity';

export enum Role {
  SUPER,
  POWER_EXPERT,
  EXPERT,
  USER,
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unique: true,
  })
  email: string;

  @Column()
  @Exclude({ toPlainOnly: true })
  password: string;

  @Column({ enum: Role, default: Role.USER })
  role: Role;

  @Column()
  avatar: string;

  @Column()
  @Exclude({ toPlainOnly: true })
  phoneToken: string;

  @OneToMany(() => Location, (location) => location.creator)
  locations: Location[];
}

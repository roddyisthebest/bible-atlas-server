import { User } from 'src/user/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

export enum ProprosalType {
  CREATE,
  UPDATE,
  DELETE,
}

@Entity()
export class Proposal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: ProprosalType;

  @Column()
  content: string;

  @Column()
  comment: string;

  @Column({ default: 0 })
  agreeCount: number;

  @Column({ default: 0 })
  disagreeCount: number;

  @Column()
  newLatitude: number;

  @Column()
  newLongitude: number;

  @ManyToOne(() => User, (user) => user.id, {
    cascade: true,
    nullable: false,
    onDelete: 'CASCADE',
  })
  creator: User;
}

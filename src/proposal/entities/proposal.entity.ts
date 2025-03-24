import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
}

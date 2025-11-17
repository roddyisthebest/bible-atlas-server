import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatePlaceReportTable1763365354667 implements MigrationInterface {
    name = 'UpdatePlaceReportTable1763365354667'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "place_report" DROP CONSTRAINT "FK_7da0001e5fd5101b9419a63086f"`);
        await queryRunner.query(`ALTER TABLE "place_report" ALTER COLUMN "type" SET DEFAULT '4'`);
        await queryRunner.query(`ALTER TABLE "place_report" ALTER COLUMN "creatorId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "place_report" ADD CONSTRAINT "FK_7da0001e5fd5101b9419a63086f" FOREIGN KEY ("creatorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "place_report" DROP CONSTRAINT "FK_7da0001e5fd5101b9419a63086f"`);
        await queryRunner.query(`ALTER TABLE "place_report" ALTER COLUMN "creatorId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "place_report" ALTER COLUMN "type" SET DEFAULT '3'`);
        await queryRunner.query(`ALTER TABLE "place_report" ADD CONSTRAINT "FK_7da0001e5fd5101b9419a63086f" FOREIGN KEY ("creatorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}

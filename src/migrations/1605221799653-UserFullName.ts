import {MigrationInterface, QueryRunner} from "typeorm";

export class UserFullName1605221799653 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.renameColumn('user', 'name', 'fullName');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // await queryRunner.query(`ALTER TABLE "user" RENAME "fullName" to "name"`);
        await queryRunner.renameColumn('user', 'fullName', 'name');
    }

}

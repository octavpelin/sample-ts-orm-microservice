import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTwoFactorAuth1605228812634 implements MigrationInterface {
  name = 'AddTwoFactorAuth1605228812634';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "user" ADD "twoFactorAuthenticationCode" character varying');
    await queryRunner.query('ALTER TABLE "user" ADD "isTwoFactorAuthenticationEnabled" boolean NOT NULL DEFAULT(FALSE)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "user" DROP COLUMN "isTwoFactorAuthenticationEnabled"');
    await queryRunner.query('ALTER TABLE "user" DROP COLUMN "twoFactorAuthenticationCode"');
  }

}

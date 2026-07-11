-- AlterTable
ALTER TABLE `Payment` ADD COLUMN `idempotencyBodyHash` VARCHAR(191) NULL;

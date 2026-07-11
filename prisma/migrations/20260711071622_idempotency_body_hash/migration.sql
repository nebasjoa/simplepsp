-- AlterTable
ALTER TABLE `payment` ADD COLUMN `idempotencyBodyHash` VARCHAR(191) NULL;

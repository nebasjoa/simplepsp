-- AlterTable
ALTER TABLE `merchant` ADD COLUMN `cardEnabled` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `googlePayEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `paypalEnabled` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `payment` ADD COLUMN `paymentMethod` VARCHAR(191) NOT NULL DEFAULT 'card';

-- AlterTable
ALTER TABLE `Payment` ADD COLUMN `settledAmount` INTEGER NULL,
    ADD COLUMN `settlementBatchId` VARCHAR(191) NULL,
    ADD COLUMN `settlementOutcome` VARCHAR(191) NULL,
    ADD COLUMN `settlementReason` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `SettlementBatch` (
    `id` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `paymentCount` INTEGER NOT NULL DEFAULT 0,
    `settledCount` INTEGER NOT NULL DEFAULT 0,
    `failedCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_settlementBatchId_fkey` FOREIGN KEY (`settlementBatchId`) REFERENCES `SettlementBatch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

/*
  Warnings:

  - Added the required column `deliveryLat` to the `deliveries` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deliveryLng` to the `deliveries` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "deliveries" ADD COLUMN     "deliveryLat" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "deliveryLng" DOUBLE PRECISION NOT NULL;

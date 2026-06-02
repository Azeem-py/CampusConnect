-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isDeactivated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "profilePrivacy" TEXT NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN     "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showReputation" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "weeklyDigest" BOOLEAN NOT NULL DEFAULT true;

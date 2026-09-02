-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "geofence_lat" DECIMAL(9,6),
ADD COLUMN     "geofence_lng" DECIMAL(9,6),
ADD COLUMN     "geofence_radius_m" INTEGER,
ADD COLUMN     "geofence_points" JSONB;

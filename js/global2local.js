// Import the standard geodesy module. The Cartesian functionality is available via LatLon.toCartesian().
import LatLon from 'geodesy/latlon-ellipsoidal.js';

/**
 * Convert a difference in ECEF coordinates (in meters) to local ENU coordinates.
 * @param {number} refLon - Reference longitude (degrees)
 * @param {number} refLat - Reference latitude (degrees)
 * @param {number} dX - Difference in ECEF X (meters)
 * @param {number} dY - Difference in ECEF Y (meters)
 * @param {number} dZ - Difference in ECEF Z (meters)
 * @returns {Object} An object { e, n, u } with east, north, and up components in meters.
 */
function ecefToEnu(refLon, refLat, dX, dY, dZ) {
  const lonRad = refLon * Math.PI / 180;
  const latRad = refLat * Math.PI / 180;
  const sinLat = Math.sin(latRad);
  const cosLat = Math.cos(latRad);
  const sinLon = Math.sin(lonRad);
  const cosLon = Math.cos(lonRad);

  const e = -sinLon * dX + cosLon * dY;
  const n = -sinLat * cosLon * dX - sinLat * sinLon * dY + cosLat * dZ;
  const u = cosLat * cosLon * dX + cosLat * sinLon * dY + sinLat * dZ;
  return { e, n, u };
}

/**
 * Compute the local ENU offset of an object relative to a scene.
 * Both positions are provided as arrays: [lon, lat, alt] (degrees, degrees, meters).
 * The scene becomes the origin (0,0,0) and the function returns { x, y, z } in meters.
 *
 * @param {number[]} scene  - Reference position [lon, lat, alt]
 * @param {number[]} object - Object position  [lon, lat, alt]
 * @returns {Object} { x, y, z } where x is east, y is north, and z is up.
 */
function getLocalOffset(scene, object) {
  // LatLon expects (lat, lon, height)
  const sceneLL = new LatLon(scene[1], scene[0], scene[2]);
  const objectLL = new LatLon(object[1], object[0], object[2]);

  // Convert geodetic points to Cartesian (ECEF) coordinates.
  const sceneCartesian = sceneLL.toCartesian();
  const objectCartesian = objectLL.toCartesian();

  // Compute differences in ECEF coordinates.
  const dX = objectCartesian.x - sceneCartesian.x;
  const dY = objectCartesian.y - sceneCartesian.y;
  const dZ = objectCartesian.z - sceneCartesian.z;

  // Convert the ECEF difference to local ENU coordinates.
  const enu = ecefToEnu(scene[0], scene[1], dX, dY, dZ);

  return { x: enu.e, y: enu.n, z: enu.u };
}

export { getLocalOffset };
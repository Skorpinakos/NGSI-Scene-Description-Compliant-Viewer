/**
 * Convert lat, lon, and altitude (from altitude maps) to ECEF coordinates 
 * using a simple spherical Earth approximation.
 * @param {number} lat - Latitude in degrees.
 * @param {number} lon - Longitude in degrees.
 * @param {number} h   - Altitude in meters (above mean sea level).
 * @returns {Object} { x, y, z } in meters.
 */
function sphericalToECEF(lat, lon, h) {
  const R = 6371000; // Average Earth radius in meters.
  const latRad = lat * Math.PI / 180;
  const lonRad = lon * Math.PI / 180;
  const r = R + h; // Effective radius at the given altitude.
  return {
    x: r * Math.cos(latRad) * Math.cos(lonRad),
    y: r * Math.cos(latRad) * Math.sin(lonRad),
    z: r * Math.sin(latRad)
  };
}

/**
 * Convert a difference in ECEF coordinates (in meters) to local ENU coordinates.
 * @param {number} refLon - Reference longitude in degrees.
 * @param {number} refLat - Reference latitude in degrees.
 * @param {number} dX - Difference in ECEF X (meters).
 * @param {number} dY - Difference in ECEF Y (meters).
 * @param {number} dZ - Difference in ECEF Z (meters).
 * @returns {Object} { e, n, u } with east, north, and up components in meters.
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
 * Compute the local ENU offset of an object relative to a scene using
 * altitude values from simple altitude maps.
 * Both positions are provided as arrays: [lat, lon, altitude] (degrees, degrees, meters).
 *
 * @param {number[]} scene  - Reference position [lat, lon, altitude]
 * @param {number[]} object - Object position  [lat, lon, altitude]
 * @returns {Object} { x, y, z } where x is east, y is north, and z is up.
 */
function getLocalOffset(scene, object) {
  // Convert geodetic positions to ECEF using the spherical model.
  const sceneECEF = sphericalToECEF(scene[0], scene[1], scene[2]);
  const objectECEF = sphericalToECEF(object[0], object[1], object[2]);

  // Compute differences in ECEF coordinates.
  const dX = objectECEF.x - sceneECEF.x;
  const dY = objectECEF.y - sceneECEF.y;
  const dZ = objectECEF.z - sceneECEF.z;

  // Convert the ECEF difference to local ENU coordinates.
  // Note: ecefToEnu expects (refLon, refLat, ...), so we pass scene[1] (lon) then scene[0] (lat).
  const enu = ecefToEnu(scene[1], scene[0], dX, dY, dZ);

  return { x: enu.e, y: enu.n, z: enu.u };
}

export { getLocalOffset };

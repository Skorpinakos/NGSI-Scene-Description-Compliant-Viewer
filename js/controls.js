import * as THREE from 'three';

/**
 * Moves the camera based on key input and delta time.
 * Instead of simple clamping, the new camera position is adjusted
 * to be inside one of the allowedSpaces (each defined as a THREE.Box3).
 *
 * @param {number} delta - The time delta
 * @param {Object} keys - An object where keys (like 'KeyW', etc.) are booleans
 * @param {THREE.Camera} camera - The camera whose position to update
 * @param {THREE.Box3[]} allowedSpaces - An array of allowed volumes (THREE.Box3 instances)
 */
export function handleControls(delta, keys, camera, allowedSpaces) {
  const speed = 6;
  const velocity = new THREE.Vector3();

  // Update velocity based on key input
  if (keys['KeyW']) velocity.z -= speed * delta;
  if (keys['KeyS']) velocity.z += speed * delta;
  if (keys['KeyD']) velocity.x += speed * delta;
  if (keys['KeyA']) velocity.x -= speed * delta;
  if (keys['Space']) camera.position.y -= speed * delta;
  if (keys['ControlLeft'] || keys['ControlRight']) camera.position.y += speed * delta;

  // Get the forward direction (ignoring vertical component)
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  direction.y = 0;
  direction.normalize();

  // Calculate right vector
  const right = new THREE.Vector3();
  right.crossVectors(camera.up, direction).normalize();

  // Determine movement vector based on velocity in the camera's local space
  const move = new THREE.Vector3();
  move.addScaledVector(direction, -velocity.z);
  move.addScaledVector(right, velocity.x);
  camera.position.add(move);

  // If allowedSpaces are provided, check if the new position is inside any of them.
  if (allowedSpaces && allowedSpaces.length > 0) {
    // Check if the camera is already inside one of the allowed spaces.
    const insideAny = allowedSpaces.some(space => space.containsPoint(camera.position));

    // If not, find the nearest allowed point.
    if (!insideAny) {
      let closestCandidate = new THREE.Vector3();
      let closestDistance = Infinity;
      
      // For each allowed space, clamp the camera position to that box,
      // then choose the candidate with the smallest distance.
      allowedSpaces.forEach(space => {
        const candidate = new THREE.Vector3();
        // THREE.Box3's clampPoint returns the point within the box closest to the given point.
        space.clampPoint(camera.position, candidate);
        const distance = candidate.distanceTo(camera.position);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestCandidate.copy(candidate);
        }
      });
      
      // Update camera position to the closest allowed point.
      camera.position.copy(closestCandidate);
    }
  }
}

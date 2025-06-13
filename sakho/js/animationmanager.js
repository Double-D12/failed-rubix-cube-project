import * as THREE from 'three';

export class AnimationManager {
  constructor() {
    this.activeAnimations = [];
  }

  rotateFace(faceGroup, axis, targetAngle, duration, onComplete) {
    const animation = {
      faceGroup,
      axis: axis.clone(),
      startAngle: 0,
      targetAngle,
      duration,
      elapsed: 0,
      onComplete,
      quaternionStart: new THREE.Quaternion(),
      quaternionEnd: new THREE.Quaternion()
    };

    // Set up quaternions for smooth rotation
    animation.quaternionStart.copy(faceGroup.quaternion);
    animation.quaternionEnd.setFromAxisAngle(axis, targetAngle);
    animation.quaternionEnd.multiply(animation.quaternionStart);

    this.activeAnimations.push(animation);
  }

  update(deltaTime) {
    for (let i = this.activeAnimations.length - 1; i >= 0; i--) {
      const animation = this.activeAnimations[i];
      animation.elapsed += deltaTime;
      
      const progress = Math.min(animation.elapsed / animation.duration, 1);
      
      // Use smooth step for animation
      const easedProgress = this.smoothStep(progress);
      
      // Interpolate rotation using quaternions for smooth rotation
      animation.faceGroup.quaternion.slerpQuaternions(
        animation.quaternionStart,
        animation.quaternionEnd,
        easedProgress
      );

      if (progress >= 1) {
        // Animation complete
        animation.faceGroup.quaternion.copy(animation.quaternionEnd);
        
        // Apply the rotation to individual cubelets and reset group rotation
        this.applyRotationToCubelets(animation.faceGroup, animation.axis, animation.targetAngle);
        
        if (animation.onComplete) {
          animation.onComplete();
        }
        
        this.activeAnimations.splice(i, 1);
      }
    }
  }

  applyRotationToCubelets(faceGroup, axis, angle) {
    // Create rotation matrix
    const rotationMatrix = new THREE.Matrix4().makeRotationAxis(axis, angle);
    
    // Apply rotation to each cubelet in the face group
    faceGroup.children.forEach(cubelet => {
      // Apply rotation to position
      cubelet.position.applyMatrix4(rotationMatrix);
      
      // Apply rotation to the cubelet itself
      const quaternion = new THREE.Quaternion().setFromAxisAngle(axis, angle);
      cubelet.quaternion.multiplyQuaternions(quaternion, cubelet.quaternion);
      
      // Round positions to avoid floating point errors
      cubelet.position.x = Math.round(cubelet.position.x * 1000) / 1000;
      cubelet.position.y = Math.round(cubelet.position.y * 1000) / 1000;
      cubelet.position.z = Math.round(cubelet.position.z * 1000) / 1000;
    });
    
    // Reset the face group's rotation
    faceGroup.rotation.set(0, 0, 0);
    faceGroup.quaternion.set(0, 0, 0, 1);
  }

  smoothStep(t) {
    return t * t * (3 - 2 * t);
  }

  isAnimating() {
    return this.activeAnimations.length > 0;
  }
}
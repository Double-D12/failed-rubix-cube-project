import * as THREE from 'three';

export class RubiksCube {
  constructor() {
    this.group = new THREE.Group();
    this.cubelets = [];
    this.faceGroups = {
      front: new THREE.Group(),
      back: new THREE.Group(),
      left: new THREE.Group(),
      right: new THREE.Group(),
      top: new THREE.Group(),
      bottom: new THREE.Group()
    };
    
    this.colors = {
      front: 0xff0000,   // Red
      back: 0xff8000,    // Orange
      left: 0x0000ff,    // Blue
      right: 0x00ff00,   // Green
      top: 0xffffff,     // White
      bottom: 0xffff00   // Yellow
    };

    this.init();
  }

  init() {
    // Add face groups to main group
    Object.values(this.faceGroups).forEach(faceGroup => {
      this.group.add(faceGroup);
    });

    // Create 3x3x3 grid of cubelets
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          // Skip the center cubelet (it's not visible in a real Rubik's cube)
          if (x === 0 && y === 0 && z === 0) continue;
          
          const cubelet = this.createCubelet(x, y, z);
          this.cubelets.push(cubelet);
          this.assignToFaceGroups(cubelet, x, y, z);
        }
      }
    }
  }

  createCubelet(x, y, z) {
    const size = 0.95;
    const geometry = new THREE.BoxGeometry(size, size, size);
    
    // Create materials for each face
    const materials = [
      new THREE.MeshStandardMaterial({ 
        color: x === 1 ? this.colors.right : 0x222222,
        roughness: 0.1,
        metalness: 0.3
      }), // Right
      new THREE.MeshStandardMaterial({ 
        color: x === -1 ? this.colors.left : 0x222222,
        roughness: 0.1,
        metalness: 0.3
      }), // Left
      new THREE.MeshStandardMaterial({ 
        color: y === 1 ? this.colors.top : 0x222222,
        roughness: 0.1,
        metalness: 0.3
      }), // Top
      new THREE.MeshStandardMaterial({ 
        color: y === -1 ? this.colors.bottom : 0x222222,
        roughness: 0.1,
        metalness: 0.3
      }), // Bottom
      new THREE.MeshStandardMaterial({ 
        color: z === 1 ? this.colors.front : 0x222222,
        roughness: 0.1,
        metalness: 0.3
      }), // Front
      new THREE.MeshStandardMaterial({ 
        color: z === -1 ? this.colors.back : 0x222222,
        roughness: 0.1,
        metalness: 0.3
      })  // Back
    ];

    const cubelet = new THREE.Mesh(geometry, materials);
    cubelet.position.set(x, y, z);
    cubelet.castShadow = true;
    cubelet.receiveShadow = true;
    
    // Store original position for reference
    cubelet.userData.originalPosition = new THREE.Vector3(x, y, z);
    
    // Add black edges
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0x000000, 
      linewidth: 1 
    });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    cubelet.add(wireframe);
    
    return cubelet;
  }

  assignToFaceGroups(cubelet, x, y, z) {
    // Assign cubelets to face groups based on their position
    if (z === 1) this.faceGroups.front.add(cubelet);
    if (z === -1) this.faceGroups.back.add(cubelet);
    if (x === -1) this.faceGroups.left.add(cubelet);
    if (x === 1) this.faceGroups.right.add(cubelet);
    if (y === 1) this.faceGroups.top.add(cubelet);
    if (y === -1) this.faceGroups.bottom.add(cubelet);
  }

  getFaceGroup(faceName) {
    return this.faceGroups[faceName];
  }

  rotateFace(faceName, direction = 1) {
    const faceGroup = this.faceGroups[faceName];
    if (!faceGroup) return null;

    // Determine rotation axis based on face
    let axis;
    switch (faceName) {
      case 'front':
      case 'back':
        axis = new THREE.Vector3(0, 0, faceName === 'front' ? 1 : -1);
        break;
      case 'left':
      case 'right':
        axis = new THREE.Vector3(faceName === 'right' ? 1 : -1, 0, 0);
        break;
      case 'top':
      case 'bottom':
        axis = new THREE.Vector3(0, faceName === 'top' ? 1 : -1, 0);
        break;
    }

    // Calculate rotation angle
    const angle = (Math.PI / 2) * direction;

    return { faceGroup, axis, angle };
  }

  getFaceNameFromIntersection(intersection) {
    const point = intersection.point;
    const normal = intersection.face.normal;
    
    // Transform normal to world space
    const worldNormal = normal.clone().transformDirection(intersection.object.matrixWorld);
    
    // Determine which face was clicked based on normal
    if (Math.abs(worldNormal.z) > 0.8) {
      return worldNormal.z > 0 ? 'front' : 'back';
    } else if (Math.abs(worldNormal.x) > 0.8) {
      return worldNormal.x > 0 ? 'right' : 'left';
    } else if (Math.abs(worldNormal.y) > 0.8) {
      return worldNormal.y > 0 ? 'top' : 'bottom';
    }
    
    return null;
  }

  scramble(animationManager) {
    const faces = ['front', 'back', 'left', 'right', 'top', 'bottom'];
    const moves = 20;
    let moveCount = 0;
    
    const doMove = () => {
      if (moveCount < moves) {
        const face = faces[Math.floor(Math.random() * faces.length)];
        const clockwise = Math.random() > 0.5;
        const direction = clockwise ? 1 : -1;
        
        const rotationData = this.rotateFace(face, direction);
        if (rotationData) {
          animationManager.rotateFace(
            rotationData.faceGroup,
            rotationData.axis,
            rotationData.angle,
            0.2,
            () => {
              moveCount++;
              if (moveCount < moves) {
                setTimeout(doMove, 50);
              }
            }
          );
        }
      }
    };
    
    doMove();
  }

  reset() {
    // Reset all cubelets to their original positions
    this.cubelets.forEach(cubelet => {
      const originalPos = cubelet.userData.originalPosition;
      cubelet.position.copy(originalPos);
      cubelet.rotation.set(0, 0, 0);
      cubelet.quaternion.set(0, 0, 0, 1);
      cubelet.updateMatrixWorld(true);
    });
    
    // Reset face groups
    Object.values(this.faceGroups).forEach(faceGroup => {
      faceGroup.rotation.set(0, 0, 0);
      faceGroup.quaternion.set(0, 0, 0, 1);
    });
    
    // Reassign cubelets to face groups
    this.cubelets.forEach(cubelet => {
      const pos = cubelet.position;
      this.assignToFaceGroups(cubelet, pos.x, pos.y, pos.z);
    });
  }
}
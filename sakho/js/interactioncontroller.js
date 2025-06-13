import * as THREE from 'three';

export class InteractionController {
  constructor(camera, domElement, rubiksCube, animationManager, onMoveCallback) {
    this.camera = camera;
    this.domElement = domElement;
    this.rubiksCube = rubiksCube;
    this.animationManager = animationManager;
    this.onMoveCallback = onMoveCallback;
    
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.touchStart = new THREE.Vector2();
    this.hoveredObject = null;
    this.originalMaterial = null;
    this.isDragging = false;
    this.isTouchDevice = 'ontouchstart' in window;

    this.setupEventListeners();
  }

  setupEventListeners() {
    if (this.isTouchDevice) {
      // Touch events
      this.domElement.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
      this.domElement.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });
      this.domElement.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    } else {
      // Mouse events
      this.domElement.addEventListener('mousedown', (e) => this.onMouseDown(e));
      this.domElement.addEventListener('mouseup', (e) => this.onMouseUp(e));
      this.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
    }
    
    // Prevent context menu
    this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  onMouseDown(event) {
    this.isDragging = true;
    this.updateMousePosition(event);
  }

  onMouseUp(event) {
    if (!this.isDragging) return;
    
    this.updateMousePosition(event);
    this.handleInteraction();
    this.isDragging = false;
  }

  onMouseMove(event) {
    if (!this.isDragging) {
      this.updateMousePosition(event);
      this.updateHoverEffect();
    }
  }

  onTouchStart(event) {
    if (event.touches.length === 1) {
      this.isDragging = true;
      this.updateTouchPosition(event.touches[0]);
      event.preventDefault();
    }
  }

  onTouchEnd(event) {
    if (event.touches.length === 0 && this.isDragging) {
      this.handleInteraction();
      this.isDragging = false;
      event.preventDefault();
    }
  }

  onTouchMove(event) {
    if (event.touches.length === 1 && this.isDragging) {
      this.updateTouchPosition(event.touches[0]);
      event.preventDefault();
    }
  }

  updateTouchPosition(touch) {
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
  }

  updateMousePosition(event) {
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  handleInteraction() {
    if (this.animationManager.isAnimating()) return;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.rubiksCube.cubelets);
    
    if (intersects.length > 0) {
      const intersection = intersects[0];
      const faceName = this.rubiksCube.getFaceNameFromIntersection(intersection);
      
      if (faceName) {
        this.rotateFace(faceName);
      }
    }
  }

  updateHoverEffect() {
    if (this.animationManager.isAnimating()) return;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.rubiksCube.cubelets);
    
    // Reset previous hover
    if (this.hoveredObject && this.originalMaterial) {
      this.hoveredObject.material = this.originalMaterial;
      this.hoveredObject = null;
      this.originalMaterial = null;
    }

    if (intersects.length > 0) {
      const object = intersects[0].object;
      this.hoveredObject = object;
      this.originalMaterial = object.material.slice(); // Clone materials array
      
      // Create hover effect
      const hoverMaterials = object.material.map(material => {
        const hoverMaterial = material.clone();
        hoverMaterial.emissive = new THREE.Color(0x333333);
        return hoverMaterial;
      });
      
      object.material = hoverMaterials;
    }
  }

  rotateFace(faceName) {
    if (this.animationManager.isAnimating()) return;

    const rotationData = this.rubiksCube.rotateFace(faceName);
    if (!rotationData) return;

    this.animationManager.rotateFace(
      rotationData.faceGroup,
      rotationData.axis,
      rotationData.angle,
      0.3,
      () => {
        this.updateFaceGroupAssignments(faceName);
        this.onMoveCallback();
      }
    );
  }

  updateFaceGroupAssignments(rotatedFace) {
    const faceGroup = this.rubiksCube.getFaceGroup(rotatedFace);
    
    // Update the world matrices of all cubelets in the rotated face
    faceGroup.children.forEach(cubelet => {
      cubelet.updateMatrixWorld(true);
      
      // Reassign cubelets to face groups based on new positions
      const pos = cubelet.position;
      this.rubiksCube.assignToFaceGroups(cubelet, pos.x, pos.y, pos.z);
    });
  }

  update() {
    // Update any ongoing interactions
  }
}
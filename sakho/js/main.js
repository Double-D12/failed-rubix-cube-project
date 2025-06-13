import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RubiksCube } from './rubiksCube.js';
import { InteractionController } from './interactionController.js';
import { AnimationManager } from './animationManager.js';

class RubiksCubeGame {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.clock = new THREE.Clock();
    this.moveCount = 0;
    this.startTime = Date.now();
    this.timerInterval = null;
    
    this.init();
  }

  init() {
    // Setup renderer with device pixel ratio
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x1a1a2e);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('gameContainer').appendChild(this.renderer.domElement);

    // Setup camera
    this.camera.position.set(6, 6, 6);

    // Setup lighting
    this.setupLighting();

    // Create Rubik's cube
    this.rubiksCube = new RubiksCube();
    this.scene.add(this.rubiksCube.group);

    // Setup controls with touch support
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 12;
    this.controls.enablePan = false;

    // Setup animation manager
    this.animationManager = new AnimationManager();

    // Setup interaction controller
    this.interactionController = new InteractionController(
      this.camera,
      this.renderer.domElement,
      this.rubiksCube,
      this.animationManager,
      () => this.incrementMoveCount()
    );

    // Setup UI events
    this.setupUI();

    // Setup resize handler
    window.addEventListener('resize', () => this.onWindowResize());

    // Start timer
    this.startTimer();

    // Start game loop
    this.animate();
  }

  setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 15, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    this.scene.add(directionalLight);

    // Fill light
    const fillLight = new THREE.DirectionalLight(0x4080ff, 0.3);
    fillLight.position.set(-5, 5, 5);
    this.scene.add(fillLight);
  }

  setupUI() {
    document.getElementById('scrambleBtn').addEventListener('click', () => {
      if (!this.animationManager.isAnimating()) {
        this.playSound();
        this.rubiksCube.scramble(this.animationManager);
        this.moveCount = 0;
        this.updateMoveCounter();
        this.startTime = Date.now();
        this.updateTimer();
      }
    });
    
    document.getElementById('resetBtn').addEventListener('click', () => {
      if (!this.animationManager.isAnimating()) {
        this.playSound();
        this.rubiksCube.reset();
        this.moveCount = 0;
        this.updateMoveCounter();
        this.startTime = Date.now();
        this.updateTimer();
      }
    });
  }

  playSound() {
    const audio = new Audio('assets/sounds/click.mp3');
    audio.volume = 0.3;
    audio.play().catch(e => console.log("Audio play failed:", e));
  }

  incrementMoveCount() {
    this.moveCount++;
    this.updateMoveCounter();
    this.playSound();
  }

  updateMoveCounter() {
    document.getElementById('moveCounter').textContent = `Moves: ${this.moveCount}`;
  }

  startTimer() {
    this.updateTimer();
    this.timerInterval = setInterval(() => this.updateTimer(), 1000);
  }

  updateTimer() {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    document.getElementById('timer').textContent = `${minutes}:${seconds}`;
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const deltaTime = this.clock.getDelta();

    // Update controls
    this.controls.update();

    // Update animations
    this.animationManager.update(deltaTime);

    // Update interaction controller
    this.interactionController.update();

    // Render
    this.renderer.render(this.scene, this.camera);
  }
}

// Start the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new RubiksCubeGame();
});
document.addEventListener('DOMContentLoaded', () => {
  // Create floating cubes background
  const floatingCubes = document.getElementById('floatingCubes');
  for (let i = 0; i < 15; i++) {
    const cube = document.createElement('div');
    cube.classList.add('floating-cube');
    cube.style.left = `${Math.random() * 100}%`;
    cube.style.bottom = '-50px';
    cube.style.width = `${10 + Math.random() * 30}px`;
    cube.style.height = cube.style.width;
    cube.style.animationDelay = `${Math.random() * 15}s`;
    cube.style.animationDuration = `${10 + Math.random() * 20}s`;
    floatingCubes.appendChild(cube);
  }
  
  // Create particles background
  const particles = document.getElementById('particles');
  for (let i = 0; i < 30; i++) {
    const particle = document.createElement('div');
    particle.classList.add('particle');
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.bottom = '-5px';
    particle.style.width = `${1 + Math.random() * 3}px`;
    particle.style.height = particle.style.width;
    particle.style.animationDelay = `${Math.random() * 10}s`;
    particle.style.animationDuration = `${5 + Math.random() * 15}s`;
    particles.appendChild(particle);
  }
});
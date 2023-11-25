import * as THREE from "three";
import Maze from "./assets/js/Maze.js";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";

const rootNode= document.getElementById("mazeContainer");

//////                               //////
////// simulated environment updates //////
//////                               //////

const sampleUpdates= [
  {
    "id": 0,
    "direction": 0,
    "floor": 0,
    "walls": 0b0111,
    "victim": 10
  },
  {
    "id": 1,
    "positionUpdate": 1,
    "floor": 0,
    "walls": 0b0101,
  },
  {
    "id": 2,
    "positionUpdate": 1,
    "floor": 3,
    "walls": 0b1001,
  },
  {
    "id": 3,
    "direction": 1,
    "positionUpdate": 1,
    "floor": 0,
    "walls": 0b1001,
    "victim": 0
  },
  {
    "id": 4,
    "direction": 2,
    "floor": 2,
    "positionUpdate": 1,
    "walls": 0b1101,
  }
];

async function main(){
  //////             //////
  ////// scene setup //////
  //////             //////

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(10, rootNode.clientWidth / rootNode.clientHeight, 0.1, 1000);
  camera.position.set(1, 5, 5);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
  });
  renderer.setSize(rootNode.clientWidth, rootNode.clientHeight);

  //////        //////
  ////// lights //////
  //////        //////

  const sun = new THREE.PointLight(0xffffff, 15);
  sun.position.set(2, 2, 2);

  // const pointLightHelper = new THREE.PointLightHelper(sun);
  // scene.add(pointLightHelper);

  const lightHolder = new THREE.Group();
  lightHolder.add(sun);

  scene.add(lightHolder)

  const minLightLevel = new THREE.AmbientLight(0x606060); // Color in hexadecimal
  scene.add(minLightLevel);
  
  
  //////                //////
  ////// controls setup //////
  //////                //////

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.LEFT,
    MIDDLE: THREE.MOUSE.MIDDLE,
    RIGHT: THREE.MOUSE.RIGHT
  };
  controls.enablePan= false;

  //////                           //////
  ////// 3D environment generation //////
  //////                           //////

  var axisHelper = new THREE.AxesHelper(3); // 3 is the size of the axes
  scene.add(axisHelper);

  const maze= new Maze();
  await maze.initialize3DModel();

  for (const update of sampleUpdates) {
    maze.update(update);
  }
  scene.add(maze._3DModel);

  rootNode.appendChild(renderer.domElement);

  //////                //////
  ////// animation loop //////
  //////                //////

  const animate = () => {
    requestAnimationFrame(animate);
  
    lightHolder.quaternion.copy(camera.quaternion);
  
    renderer.render(scene, camera);
  };
  
  animate();

  //////          //////
  ////// refining //////
  //////          //////

  // make the renderer responsive
  window.addEventListener('resize', ()=> {
    const containerWidth = rootNode.clientWidth;
    const containerHeight = rootNode.clientHeight;
  
    // Update camera aspect ratio
    camera.aspect = containerWidth / containerHeight;
    camera.updateProjectionMatrix();
  
    // Update renderer size
    renderer.setSize(containerWidth, containerHeight);
  });
}

main();
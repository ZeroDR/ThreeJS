<template>
  <div id="labelInfo" ref="threeRef" class="label-info">
  </div>
</template>

<script lang="ts" setup>
import {
  ref,
  reactive,
  onMounted,
  onUnmounted,
} from 'vue'
import { formatTime } from '@/utils/index'
import { WEEK } from '@/constant/index'
import useDraw from '@/utils/useDraw'

import SceneView from '@/utils/scene/SceneView.js'

import {Scene,PerspectiveCamera,WebGLRenderer,Color,AxesHelper,PlaneGeometry,MeshBasicMaterial,TextureLoader,Mesh,DoubleSide,BoxGeometry, SphereGeometry,Clock} from 'three'

import {OrbitControls} from '@/utils/OrbitControls.js'

import {creatWallByPath,createOpacityWallMat,createFlowWallMat} from '@/utils/scene/effect/WallByPath.js'
import {creartStarPoints,renderStar} from '@/utils/scene/effect/StarEffect.js'
import {createSpreda,renderSpread} from '@/utils/scene/effect/Spread.js'


const threeRef=ref();
const scene=new Scene();
const renderer=new WebGLRenderer({antialias:true});
const camera=new PerspectiveCamera(45,window.innerWidth/window.innerHeight);
let wallMesh;
let wallMat;
let clock = new Clock();

const loadScene = () => {
  const axes=new AxesHelper(20)
  scene.add(axes)

  renderer.setClearColor(new Color(0x000000))
  renderer.setSize(window.innerWidth,window.innerHeight)


  const planeGeometry=new PlaneGeometry(300,200);
  const planeBasicMaterial=new MeshBasicMaterial({
    color:0xcccccc,
    side: DoubleSide,
  });
  const plane=new Mesh(planeGeometry,planeBasicMaterial)
  plane.rotation.x=-0.5*Math.PI
  plane.position.x=30
  plane.position.y=0;
  plane.position.z=0;
  // scene.add(plane)

  // //盒子几何体
  // const cubeGeometry=new BoxGeometry(4,4,14)
  // const cubeMaterial=new MeshBasicMaterial({color:0xff0000,wireframe:true});
  // const cube=new Mesh(cubeGeometry,cubeMaterial)
  // //cube.rotation.x=-0.5*Math.PI
  // cube.position.x=10
  // cube.position.y=3;
  // cube.position.z=10;
  // scene.add(cube)

  //球形几何体
  const sphereGeometry=new SphereGeometry(4,20,20);
  const sphereMaterial=new MeshBasicMaterial({color:0x77777ff,wireframe:true})
  const sphere=new Mesh(sphereGeometry,sphereMaterial);
  sphere.position.x=40
  sphere.position.y=4;
  sphere.position.z=10;
  // scene.add(sphere);
  // 纹理贴图
    let textureLoader = new TextureLoader();
    const geometry = new SphereGeometry(20, 20, 20);
    textureLoader.load("./assets/images/8k_earth_daymap.jpg",(texture)=>{
      const earthMat = new MeshBasicMaterial({
        map: texture,
      });
      const mesh = new Mesh(geometry, earthMat);
      scene.add(mesh);
    });

  // // 创建墙
  // // 规划路径
  // const path = [
  //   [80, 0, -40],
  //   [10, 0, 0],
  //   [60, 0, 50],
  //   [0, 10, 0],
  //   [-60, 0, 50],
  //   [-50, 0, -30],
  //   [80, 0, -40],
  // ];
  // // const wallMesh = creatWallByPath({ path });
  // // const material = createOpacityWallMat({ height: 15, speed: 5 });
  // wallMat = createFlowWallMat({});
  // wallMesh = creatWallByPath({
  //   path,
  //   material:wallMat,
  //   height: 15,
  // });
  // 动画
  // animationList.push(() => {
  //   wallMesh.material.uniforms.time.value +=
  //   clock.getDelta() * wallMesh.material.uniforms.speed.value;
  // });
  // scene.add(wallMesh);
  // scene.add(wallLine);

  // // 创建星空
  // points = creartStarPoints();
  // scene.add(points);

  // // 创建扩散效果
  // const spreadEffect = createSpreda();
  // scene.add(spreadEffect);


  camera.position.x=-30;
  camera.position.y=40;
  camera.position.z=200;
  camera.lookAt(scene.position)
  threeRef.value.appendChild(renderer.domElement)
  renderer.render(scene,camera);

  const controls = new OrbitControls(camera,renderer.domElement);
  //监听鼠标事件，触发渲染函数，更新canvas画布渲染效果
  // controls.addEventListener('change', render);

  render();
}

const render = () => {
  renderer.render(scene, camera); //执行渲染操作
  // renderStar();// 星空效果
  // 透明墙效果
  // wallMesh.material.uniforms.time.value +=
  // clock.getDelta() * wallMesh.material.uniforms.speed.value;
  // // 流动墙效果
  // wallMat.uniforms.time.value += 0.01;

  // renderSpread();
  requestAnimationFrame(render);
}


onMounted(() => {
  // console.log(1111111);
  // const scene = new SceneView();
  // scene.init('labelInfo');
  loadScene();
})


</script>

<style lang="scss" scoped>
@import '@/assets/scss/index.scss';
.label-info{
  position:absolute;
  visibility: visible;
  color: rgb(255, 255, 255);
  z-index: 1;
}
</style>

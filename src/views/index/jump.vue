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

import {Scene,PerspectiveCamera,WebGLRenderer,Color,AxesHelper,PlaneGeometry,MeshBasicMaterial,TextureLoader,Mesh,DoubleSide,BoxGeometry, SphereGeometry,Clock,Vector3,GridHelper} from 'three'

import {OrbitControls} from '@/utils/scene/OrbitControls.js'
import {onIntersect} from '@/utils/scene/tools/UtilsTools.js'

const threeRef=ref();
const scene=new Scene();
const renderer=new WebGLRenderer({antialias:true});
const camera=new PerspectiveCamera(45,window.innerWidth/window.innerHeight);
let clock = new Clock();

const MAX_HEIGHT = 10;
const MIN_HEIGHT = 4;

let hasDown = false;// 是否向下
let hasUp = true;// 是否向上
let hasJump = false;// 是否跳动
let jumpSpeed = 0;//
let hasX = true;// 是否沿X轴跳


// 跳对象
let jump;
let cube,cube1,cube2 = undefined;
const cubeGeometry=new BoxGeometry(4,2,4)
const cubeMaterial=new MeshBasicMaterial({color:0x00BCD4,wireframe:false});
let cubeList = [];
const MAX_Y = 10;
const MIN_Y = 7;

const loadScene = () => {
  // 坐标辅助
  const axes=new AxesHelper(20);
  scene.add(axes)

  renderer.setClearColor(new Color(0x000000))
  renderer.setSize(window.innerWidth,window.innerHeight);

  let gridHelper = new GridHelper( 100, 100, 0x2C2C2C, 0x888888 );
  gridHelper.position.y = 1;
  scene.add(gridHelper);

  //盒子几何体
  
  cube=new Mesh(cubeGeometry,cubeMaterial)
  //cube.rotation.x=-0.5*Math.PI
  cube.position.x=2
  cube.position.y=0;
  cube.position.z=2;
  scene.add(cube);

  //盒子几何体
  cube1=new Mesh(cubeGeometry,cubeMaterial)
  //cube.rotation.x=-0.5*Math.PI
  cube1.position.x=20
  cube1.position.y=0;
  cube1.position.z=2;
  scene.add(cube1);

  cubeList = [cube,cube1];

  const jumpGeometry=new BoxGeometry(1,1,1)
  const jumpMaterial=new MeshBasicMaterial({color:0xFFC107,wireframe:false});
  jump=new Mesh(jumpGeometry,jumpMaterial)
  //cube.rotation.x=-0.5*Math.PI
  jump.position.x=2
  jump.position.y=1.5;
  jump.position.z=2;
  scene.add(jump);

  camera.position.x=-30;
  camera.position.y=40;
  camera.position.z=200;
  // camera.lookAt(scene.position)
  threeRef.value.appendChild(renderer.domElement)
  renderer.render(scene,camera);

  camera.lookAt(jump);

  const controls = new OrbitControls(camera,renderer.domElement);

  render();
}

const createClub = () => {
  const lastBox = cubeList.at(-1);
  const box = new Mesh(cubeGeometry,cubeMaterial);
  if(hasX){
    box.position.x = lastBox.position.x + 18;
    box.position.y = lastBox.position.y;
    box.position.z = lastBox.position.z;
  }else{
    box.position.x = lastBox.position.x;
    box.position.y = lastBox.position.y;
    box.position.z = lastBox.position.z + 18;
  }
  scene.add(box);
  cubeList.push(box);
}

const resetJumpInit = () => {
  hasJump = false;
  hasUp = true;
  hasDown = false;
  hasX = true;
  jumpSpeed = 0;
  jump.position.x=2
  jump.position.y=1.5;
  jump.position.z=2;
  for(let i = 2,length = cubeList.length;i<length;i++){
    scene.remove(cubeList[i]);
  }
  cubeList.length = 2;
}

// 注册事件
const keydownEvent = (e) => {
  if(e.keyCode === 32){
    jumpSpeed += 0.04;
    hasJump = false;
  }
}
const keyupEvent = (e) => {
  if(e.keyCode === 32){
    hasJump = true;
  }
}

const render = () => {
  renderer.render(scene, camera); //执行渲染操作
  // parseInt(jump.position.y) === 4 && (hasDown=false,hasUp=true);
  if(jump){
    if(hasJump){
      // // 判断是否跳出台阶面
      if(jump.position.y < 0) {
        resetJumpInit();
      }
      const speedY = jumpSpeed*100;
      console.log(speedY);
      (parseInt(jump.position.y) === (speedY < MIN_Y ? MIN_Y : (speedY > MAX_Y ? MAX_Y : speedY))) && (hasDown=true,hasUp=false);

      hasX ? (jump.position.x += jumpSpeed) : (jump.position.z += jumpSpeed);
      hasUp && (jump.position.y += jumpSpeed);
      hasDown && (jump.position.y -= jumpSpeed);
      // 判断两个模型是否相撞
      const hasInter = onIntersect(jump,cubeList.at(-1));
      if(hasJump && hasInter){
        hasX = parseInt(Math.random() * 10) > 5;
        createClub();
        jumpSpeed = 0;
        hasJump = false;
        hasUp = true;
        hasDown = false;
      }
    }
  }
  requestAnimationFrame(render);
}

onMounted(() => {
  loadScene();
  document.addEventListener('keydown',keydownEvent,false);
  document.addEventListener('keyup',keyupEvent,false);
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

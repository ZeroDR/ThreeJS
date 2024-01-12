//工具类
import * as THREE from 'three'

//经纬度与世界坐标转换
export const getPosition = (lng,lat,radius) => {
	const phi = (180 + lng) * (Math.PI / 180);
	const theta = (90 - lat) * (Math.PI / 180);
	return {
	 	x: -radius * Math.sin(theta) * Math.cos(phi),
	 	y: radius * Math.cos(theta),
	 	z: radius * Math.sin(theta) * Math.sin(phi),
	 };
}

// 解析GeoJson中的所有的图形集合
export const parseGeoJson = ({ features }) => {
	if (!features.length) return [];
    return features.reduce((areas, item) => {
      const { coordinates } = item.geometry;
      return areas.concat(
        coordinates.reduce((careas, citem) => {
          return careas.concat(citem);
        }, [])
      );
    }, []);
}

export const onIntersect = (cube,cube2) => {
  // 声明一个变量用来表示是否碰撞
  let bool = false

  // .position 对象局部位置
  // .clone() 复制一个新的三维向量
  // 网格中心 世界坐标
  const centerCoord = cube.position.clone()
  // 获取网格中 几何对象的顶点对象
  const position = cube.geometry.attributes.position
  // 顶点三维向量
  const vertices = []
  // .count 矢量个数
  for (let i = 0; i < position.count; i++) {
    // .getX() 获取给定索引的矢量的第一维元素
    vertices.push(new THREE.Vector3(position.getX(i), position.getY(i), position.getZ(i)))
  }

  for (let i = 0; i < vertices.length; i++) {
    // .matrixWorld 物体的世界坐标变换 -- 物体旋转、位移 的四维矩阵
    // .applyMatrix4() 将该向量乘以四阶矩阵
    // 获取世界坐标下 网格变换后的坐标
    let vertexWorldCoord = vertices[i].clone().applyMatrix4(cube.matrixWorld)

    // .sub(x) 从该向量减去x向量
    // 获得由中心指向顶点的向量
    var dir = vertexWorldCoord.clone().sub(centerCoord)

    // .normalize() 将该向量转换为单位向量
    // 发射光线 centerCoord 为投射的原点向量  dir 向射线提供方向的方向向量
    let raycaster = new THREE.Raycaster(centerCoord, dir.clone().normalize())

    // 放入要检测的 物体cube2，返回相交物体
    let intersects = raycaster.intersectObjects([cube2], true)

    if (intersects.length > 0) {
      // intersects[0].distance：射线起点与交叉点之间的距离(交叉点：射线和模型表面交叉点坐标)
      // dir.length()：几何体顶点和几何体中心构成向量的长度
      // intersects[0].distance小于dir.length() 表示物体相交
      if (intersects[0].distance < dir.length()) {
        bool = true
      }
    }
  }
  return bool
}

export const getCubicBezierPoints = (v0,v3)=>{
  //夹角
  let angle = (v0.angleTo(v3) * 1.8) / Math.PI / 0.1;//0~Math.PI
  let aLen = angle * 0.4,
      hLen = angle * angle * 12;
  let p0 = new  THREE.Vector3(0,0,0);//用于求两点形成的向量的法向量

  //法线向量：THREE.Ray(v1,v2) 向量v1v2缩成方向的法向量
  let rayLine = new THREE.Ray(p0,getVCenter(v0.clone(),v3.clone()));//圆点与向量v0,v3的终点形成的垂直于向量v0v3的向量

  //顶点坐标
  let temp = new THREE.Vector3()
  let vtop = rayLine.at(hLen / rayLine.at(1,temp).distanceTo(p0),temp);

  //控制点坐标
  let v1 = getLenVcetor(v0.clone(),vtop,aLen);
  let v2 = getLenVcetor(v3.clone(),vtop,aLen);
  //绘制贝塞尔曲线
  let curve = new THREE.CubicBezierCurve3(v0,v1,v2,v3);

  return curve.getPoints(50);
}

// 创建一条平滑的三维 二次贝塞尔曲线
export const getQuadraticBezierPoints = (v0,v1,v2)=>{
  const curve = new THREE.QuadraticBezierCurve3(v0,v1,v2);
  // const curve = new THREE.QuadraticBezierCurve(v0,v1,v2); // 创建二维二次贝塞尔曲线

  return curve.getPoints(50);
}

// 创建半圆弧线
export const getArcCurvePoints = (v0,v2)=>{
  let arc = new THREE.ArcCurve(0, 0, 5, 0, Math.PI)

  return arc.getPoints(50); 
}

// 计算v1,v2 的中点
const getVCenter = (v1, v2) => {
    let v = v1.add(v2);
    return v.divideScalar(2);
}

// 计算V1，V2向量固定长度的点
const getLenVcetor = (v1, v2, len) => {
    let v1v2Len = v1.distanceTo(v2);
    return v1.lerp(v2, len / v1v2Len);
}
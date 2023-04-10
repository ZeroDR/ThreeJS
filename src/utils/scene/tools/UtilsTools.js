//工具类

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
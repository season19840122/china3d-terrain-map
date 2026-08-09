# 山河三维 · 中国地形交互可视化

基于 Three.js 的中国 3D 地形交互地图，单页应用，浏览器直接打开 `index.html` 即可运行（需联网加载 three.js 与地图边界数据）。

## 功能

- **地形三大阶梯**：省级行政区按阶梯分色挤出，支持 GDP / 常住人口数据着色
- **完整数据**：34 个省级区 2025 年 GDP、人口、省会，省内经济前三城市（含海拔）
- **周边国家与海洋**：16 个邻国边界、首都标注，海域名称，世界地图视角
- **风景名胜**：44 座名山（海拔标注）、长江/黄河/珠江（顺流光点动画）、五大真实轮廓湖泊（微波纹）
- **专题线**：三大阶梯分界线、胡焕庸线
- **交互**：悬停高亮、点击锁定/反选、省份详情面板、图层开关、明暗双主题、旋转/缩放/平移

## 目录结构

```
├── index.html        结构层
└── assets/
    ├── index.css     样式层
    ├── gdp.min.js    经济数据层（压缩版）
    └── index.min.js  逻辑层（压缩混淆版）
```

> 源码（`index.js` / `gdp.js`）与 sourcemap 仅保留在本地用于维护，未随公开仓库发布。

## 数据来源

- 省界/国界：阿里 DataV GeoAtlas、Natural Earth
- 经济数据：各省统计局 2025 年统计公报、香港政府统计处、澳门统计暨普查局（2025 年口径）
- 海拔：open-elevation

## 维护

修改 `assets/index.js` / `assets/gdp.js` 后重新压缩：

```bash
npx terser@5 assets/index.js --module -c -m --source-map "filename=assets/index.min.js.map,url=index.min.js.map" -o assets/index.min.js
npx terser@5 assets/gdp.js -c -m --source-map "filename=assets/gdp.min.js.map,url=gdp.min.js.map" -o assets/gdp.min.js
```

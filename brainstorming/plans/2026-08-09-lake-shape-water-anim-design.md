# 湖泊真实轮廓 + 水体动效 设计

日期：2026-08-09
项目：山河三维 · 中国地形交互可视化（index.html，单文件 Three.js 页面）
状态：用户已批准（三项全做）

## 背景
现有"风景名胜"图层中，湖泊为圆形水面（THREE.CircleGeometry），用户要求：
1. 湖泊按实际形状绘制
2. 河流加流向动画（光点顺流而下）
3. 湖泊加微波纹

## 数据源
- 湖泊轮廓：Natural Earth 10m lakes（ne_10m_lakes.geojson）
  - 鄱阳湖 406 点 / 洞庭湖 186 / 太湖 133 / 洪泽湖 301 / 青海湖 126（单环）
  - 构建时脚本抽稀至每湖约 50–90 点内嵌（约 15KB）
- 页面坐标系：x=(lng-105)*111，z=-(lat-36)*111，y=地形顶面

## 设计

### A. 湖泊真实轮廓
- LAKES 数据结构改为 { name, 标签位置, poly: [[x,z]...] }（外环，抽稀后）
- THREE.Shape → ShapeGeometry，rotation.x=-PI/2 平铺
- y 取轮廓 bbox 四角 + 中心地形高度最大值 +0.2，防埋
- 保留湖名标签；主题联动（亮色换深色水面）沿用 scenicMats 登记机制

### B. 河流流向光点
- 复用现有 CatmullRom 河流曲线
- 每条河 8 个光点：t_i = (base + time*speed) - i*gap，mod 1 循环
- 头部最亮、尾部渐暗（opacity 递减），顺流方向 = pts 源→口方向
- 光点 y 用 curve.getPointAt(t).y + 0.15 贴地

### C. 湖泊微波纹
- 每湖中心 2 个 THREE.RingGeometry 波纹环，交替扩张+淡出循环
- scale 1→r（湖等效半径），opacity 0.5→0

### 开关与主题
- 全部对象挂在 scenicGroup 下，"风景名胜"开关沿用 setLayerVisible
- 光点/波纹材质登记进 scenicMats，亮色主题换深色
- 动画更新在现有渲染循环中，scenicGroup 不可见时跳过

## 用户批准
用户选择"确认，三项全做"。

---

内容由 AI 生成

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

/* ================= 基础配置 ================= */
// 使用本地地图数据，避免线上跨域问题
const GEO_URLS = ['assets/china.json'];

// 地形阶梯配置：颜色 + 挤出高度（视觉比例，非真实海拔）
const STEP_CONFIG = {
    1: { color: 0xb5651d, height: 3.2, name: '第一级阶梯', desc: '青藏高原，平均海拔4000米以上' },
    2: { color: 0xe8a33d, height: 1.6, name: '第二级阶梯', desc: '高原与盆地，海拔1000~2000米' },
    3: { color: 0x5faf5f, height: 0.55, name: '第三级阶梯', desc: '平原与丘陵，海拔多在500米以下' }
};

// 各省阶梯归属（依据地理学通行划分）
const PROVINCE_STEP = {
    '西藏自治区': 1, '青海省': 1,
    '新疆维吾尔自治区': 2, '甘肃省': 2, '宁夏回族自治区': 2, '内蒙古自治区': 2,
    '陕西省': 2, '山西省': 2, '四川省': 2, '重庆市': 2, '云南省': 2, '贵州省': 2,
    '黑龙江省': 3, '吉林省': 3, '辽宁省': 3, '河北省': 3, '北京市': 3, '天津市': 3,
    '山东省': 3, '河南省': 3, '江苏省': 3, '安徽省': 3, '上海市': 3, '浙江省': 3,
    '湖北省': 3, '湖南省': 3, '江西省': 3, '福建省': 3, '广东省': 3, '广西壮族自治区': 3,
    '海南省': 3, '台湾省': 3, '香港特别行政区': 3, '澳门特别行政区': 3
};

// 省会 / 直辖市（经度, 纬度）
const CAPITALS = [
    { name: '北京', lng: 116.41, lat: 39.90, type: '直辖市' },
    { name: '天津', lng: 117.20, lat: 39.08, type: '直辖市' },
    { name: '上海', lng: 121.47, lat: 31.23, type: '直辖市' },
    { name: '重庆', lng: 106.55, lat: 29.56, type: '直辖市' },
    { name: '石家庄', lng: 114.51, lat: 38.04, prov: '河北' },
    { name: '太原', lng: 112.55, lat: 37.87, prov: '山西' },
    { name: '呼和浩特', lng: 111.75, lat: 40.84, prov: '内蒙古' },
    { name: '沈阳', lng: 123.43, lat: 41.80, prov: '辽宁', sub: true },
    { name: '长春', lng: 125.32, lat: 43.90, prov: '吉林', sub: true },
    { name: '哈尔滨', lng: 126.53, lat: 45.80, prov: '黑龙江', sub: true },
    { name: '南京', lng: 118.80, lat: 32.06, prov: '江苏', sub: true },
    { name: '杭州', lng: 120.15, lat: 30.29, prov: '浙江', sub: true },
    { name: '合肥', lng: 117.23, lat: 31.82, prov: '安徽' },
    { name: '福州', lng: 119.30, lat: 26.08, prov: '福建' },
    { name: '南昌', lng: 115.86, lat: 28.68, prov: '江西' },
    { name: '济南', lng: 117.12, lat: 36.65, prov: '山东', sub: true },
    { name: '郑州', lng: 113.63, lat: 34.75, prov: '河南' },
    { name: '武汉', lng: 114.31, lat: 30.59, prov: '湖北', sub: true },
    { name: '长沙', lng: 112.94, lat: 28.23, prov: '湖南' },
    { name: '广州', lng: 113.26, lat: 23.13, prov: '广东', sub: true },
    { name: '南宁', lng: 108.37, lat: 22.82, prov: '广西' },
    { name: '海口', lng: 110.33, lat: 20.03, prov: '海南' },
    { name: '成都', lng: 104.07, lat: 30.57, prov: '四川', sub: true },
    { name: '贵阳', lng: 106.63, lat: 26.65, prov: '贵州' },
    { name: '昆明', lng: 102.83, lat: 24.88, prov: '云南' },
    { name: '拉萨', lng: 91.13, lat: 29.66, prov: '西藏' },
    { name: '西安', lng: 108.94, lat: 34.34, prov: '陕西', sub: true },
    { name: '兰州', lng: 103.83, lat: 36.06, prov: '甘肃' },
    { name: '西宁', lng: 101.78, lat: 36.62, prov: '青海' },
    { name: '银川', lng: 106.23, lat: 38.49, prov: '宁夏' },
    { name: '乌鲁木齐', lng: 87.62, lat: 43.83, prov: '新疆' },
    { name: '台北', lng: 121.50, lat: 25.03, prov: '台湾' },
    { name: '香港', lng: 114.17, lat: 22.28, type: '特别行政区' },
    { name: '澳门', lng: 113.55, lat: 22.20, type: '特别行政区' }
];

// 非省会的副省级城市（计划单列市）
const SUB_CITIES = [
    { name: '深圳', lng: 114.06, lat: 22.55 },
    { name: '宁波', lng: 121.55, lat: 29.87 },
    { name: '青岛', lng: 120.38, lat: 36.07 },
    { name: '大连', lng: 121.61, lat: 38.91 },
    { name: '厦门', lng: 118.09, lat: 24.48 }
];

// 省份经济社会数据（2025年）
// gdp 单位：亿元（各省统计局2025年统计公报/政府工作报告）
// pop 单位：万人（2025年末常住人口，各省统计局公报）

// 一/二级阶梯分界线（昆仑山—祁连山—横断山脉，近似折线）
const LINE_1_2 = [
    [74, 37.5], [78, 36.8], [82, 36.3], [86, 36.2], [90, 35.8], [94, 36.2],
    [97, 36.6], [99, 37.2], [101, 37.8], [103, 37.2], [104.5, 36],
    [103, 34.5], [102, 33], [101, 31.5], [100.5, 30], [100, 28.5],
    [99, 27], [98, 25.8], [97.5, 24.5]
];

// 二/三级阶梯分界线（大兴安岭—太行山—巫山—雪峰山，近似折线）
const LINE_2_3 = [
    [122, 53], [121.5, 51], [121, 49], [120, 47], [118.5, 45.5], [117.5, 44],
    [116.5, 42.8], [115.5, 41.8], [114.8, 40.8], [114.5, 39.5], [114, 38],
    [113.5, 37], [113, 36], [112.5, 35], [111.8, 34], [111, 33],
    [110.3, 32], [110, 31.2], [109.8, 30], [110.2, 29], [110.6, 28],
    [110.3, 27], [109.8, 26], [109.3, 25]
];

// 胡焕庸线：黑河（127.53, 50.25）—腾冲（98.49, 25.02）
const LINE_HUAN = [
    [127.53, 50.25], [125.8, 47.5], [124.0, 44.8], [122.2, 42.0],
    [120.4, 39.3], [118.6, 36.6], [116.8, 33.9], [115.0, 31.2],
    [113.2, 28.5], [111.4, 25.8], [109.5, 23.6], [107.0, 23.0],
    [104.0, 23.2], [101.0, 24.0], [98.49, 25.02]
];
const HUAN_INFO = {
    eastPop: '约93.7%', westPop: '约6.3%',
    eastArea: '约43.8%', westArea: '约56.2%'
};

// 城市间飞行航线（起点, 终点, 颜色）
const FLIGHT_ROUTES = [
    { from: '北京', to: '上海', color: 0x4ac6ff },
    { from: '上海', to: '广州', color: 0x4ac6ff },
    { from: '广州', to: '成都', color: 0xffa04a },
    { from: '成都', to: '北京', color: 0xffa04a },
    { from: '北京', to: '乌鲁木齐', color: 0xff6bd6 },
    { from: '上海', to: '西安', color: 0x8affc1 },
    { from: '哈尔滨', to: '广州', color: 0xff6bd6 },
    { from: '拉萨', to: '上海', color: 0x8affc1 },
    { from: '武汉', to: '深圳', color: 0x4ac6ff },
    { from: '西安', to: '昆明', color: 0xffa04a }
];

/* ===== 各省经济前三城市（按2025年GDP排序）=====
   n:城市名 e:海拔(m，open-elevation) g:2025年GDP(亿元，有则标注) */
// 港澳无官方分区GDP，面板展示替代口径说明

/* ===== 周边国家（仅标注首都）===== */
const NEIGHBOR_COUNTRIES = [
    { en: 'Russia', zh: '俄罗斯', cap: '莫斯科', capLng: 37.62, capLat: 55.75, labelLng: 92, labelLat: 58 },
    { en: 'Mongolia', zh: '蒙古', cap: '乌兰巴托', capLng: 106.91, capLat: 47.92, labelLng: 104, labelLat: 46.2 },
    { en: 'Kazakhstan', zh: '哈萨克斯坦', cap: '阿斯塔纳', capLng: 71.45, capLat: 51.17, labelLng: 68, labelLat: 48 },
    { en: 'Kyrgyzstan', zh: '吉尔吉斯斯坦', cap: '比什凯克', capLng: 74.59, capLat: 42.87, labelLng: 74.5, labelLat: 41.3 },
    { en: 'Tajikistan', zh: '塔吉克斯坦', cap: '杜尚别', capLng: 68.78, capLat: 38.56, labelLng: 69.5, labelLat: 38.8 },
    { en: 'Afghanistan', zh: '阿富汗', cap: '喀布尔', capLng: 69.17, capLat: 34.53, labelLng: 65.5, labelLat: 33.5 },
    { en: 'Pakistan', zh: '巴基斯坦', cap: '伊斯兰堡', capLng: 73.06, capLat: 33.72, labelLng: 69.5, labelLat: 29.5 },
    { en: 'India', zh: '印度', cap: '新德里', capLng: 77.21, capLat: 28.61, labelLng: 79, labelLat: 21.5 },
    { en: 'Nepal', zh: '尼泊尔', cap: '加德满都', capLng: 85.32, capLat: 27.72, labelLng: 84, labelLat: 28.3 },
    { en: 'Bhutan', zh: '不丹', cap: '廷布', capLng: 89.64, capLat: 27.47, labelLng: 90.5, labelLat: 27.6 },
    { en: 'Myanmar', zh: '缅甸', cap: '内比都', capLng: 96.13, capLat: 19.75, labelLng: 95.5, labelLat: 21.5 },
    { en: 'Laos', zh: '老挝', cap: '万象', capLng: 102.63, capLat: 17.97, labelLng: 102.5, labelLat: 19.2 },
    { en: 'Vietnam', zh: '越南', cap: '河内', capLng: 105.85, capLat: 21.03, labelLng: 105.5, labelLat: 17 },
    { en: 'North Korea', zh: '朝鲜', cap: '平壤', capLng: 125.75, capLat: 39.02, labelLng: 126.5, labelLat: 40.3 },
    { en: 'South Korea', zh: '韩国', cap: '首尔', capLng: 126.98, capLat: 37.57, labelLng: 127.8, labelLat: 36.3 },
    { en: 'Japan', zh: '日本', cap: '东京', capLng: 139.69, capLat: 35.68, labelLng: 138.5, labelLat: 36.5 }
];
const WORLD_GEO_URL = 'https://cdn.jsdelivr.net/gh/johan/world.geo.json@master/countries.geo.json';

/* ===== 风景名胜：各省代表名山（海拔m + 经纬度）===== */
const MOUNTAINS = [
    ['北京市','灵山',2303,115.47,40.04], ['天津市','盘山',864,117.28,40.10],
    ['河北省','小五台山',2882,114.97,39.78], ['山西省','五台山',3058,113.59,38.97],
    ['山西省','恒山',2016,113.73,39.68], ['内蒙古自治区','贺兰山',3556,105.90,38.80],
    ['辽宁省','千山',709,123.00,40.95], ['吉林省','长白山',2691,128.08,41.93],
    ['黑龙江省','五大连池',597,126.12,48.72], ['上海市','佘山',101,121.20,31.10],
    ['江苏省','紫金山',449,118.85,32.05], ['浙江省','普陀山',291,122.38,30.01],
    ['浙江省','雁荡山',1057,121.07,28.37], ['安徽省','黄山',1865,118.17,30.13],
    ['安徽省','九华山',1344,117.80,30.48], ['福建省','武夷山',2161,117.67,27.75],
    ['江西省','庐山',1474,115.97,29.59], ['山东省','泰山',1545,117.10,36.25],
    ['山东省','崂山',1133,120.62,36.17], ['河南省','嵩山',1492,113.05,34.48],
    ['湖北省','武当山',1612,111.00,32.40], ['湖北省','神农顶',3106,110.27,31.45],
    ['湖南省','衡山',1300,112.68,27.30], ['湖南省','天门山',1519,110.48,29.05],
    ['广东省','罗浮山',1296,114.03,23.25], ['广东省','丹霞山',619,113.75,25.03],
    ['广西壮族自治区','猫儿山',2142,110.41,25.87], ['海南省','五指山',1867,109.70,18.88],
    ['重庆市','缙云山',952,106.40,29.80], ['四川省','峨眉山',3099,103.48,29.60],
    ['四川省','青城山',1260,103.57,30.90], ['贵州省','梵净山',2572,108.68,27.90],
    ['云南省','玉龙雪山',5590,100.17,27.12], ['云南省','梅里雪山',6740,98.62,28.51],
    ['西藏自治区','珠穆朗玛峰',8849,86.93,27.99], ['西藏自治区','南迦巴瓦峰',7782,95.07,29.64],
    ['陕西省','华山',2161,110.08,34.47], ['甘肃省','麦积山',1742,106.03,34.35],
    ['宁夏回族自治区','六盘山',2942,106.33,35.47], ['青海省','玉珠峰',6178,94.25,35.65],
    ['新疆维吾尔自治区','托木尔峰',7444,80.12,42.03],
    ['台湾省','玉山',3952,120.95,23.47], ['香港特别行政区','大帽山',958,114.15,22.41],
    ['澳门特别行政区','叠石塘山',171,113.55,22.13]
];

/* ===== 大江干流（近似折线，贴合阶梯地形）===== */
const RIVERS = [
    { name: '长 江', color: 0x3f8fd6, light: 0x2a6f9e, pts: [
        [91.2,34.2],[94,32.5],[97,30],[99,27.5],[100.5,26.2],[102,25.6],[104.6,28.8],
        [106.5,29.6],[108.5,30.8],[110.2,31.0],[111.3,30.7],[112.2,30.3],[114.3,30.6],
        [116,29.7],[117.1,30.5],[118.4,31.3],[118.8,32.05],[119.4,32.2],[120.9,32.0],[121.9,31.4]
    ]},
    { name: '黄 河', color: 0xd6a13f, light: 0xa9761f, pts: [
        [96.5,34.5],[99,34],[102,34],[102.8,35.5],[103.8,36.06],[105,37.5],[106.2,38.5],
        [107.5,40.2],[110,40.6],[110.5,38],[110.4,36],[110.2,34.5],[111.2,34.8],[112.4,35],
        [113.6,34.8],[114.3,34.8],[115.5,35.5],[117,36.7],[118.5,37.5]
    ]},
    { name: '珠 江', color: 0x3fb8a8, light: 0x1f8a7a, pts: [
        [108.3,22.8],[109.6,23.1],[111.3,23.5],[112.5,23.05],[113.26,23.13],[113.6,22.6]
    ]}
];

/* ===== 主要湖泊（经纬度 + 视觉半径）===== */
/* 湖泊真实轮廓（Natural Earth 10m，抽稀内嵌；坐标为页面投影系 [x, z]，等比放大2.5倍保持形状） */
const LAKES = [
{ name: '青海湖', center: [-3.57,-5.58], poly: [[-2.38,-5.57],[-2.26,-5.43],[-2.37,-5.35],[-2.43,-5.30],[-2.32,-5.09],[-2.34,-5.01],[-2.41,-4.72],[-2.48,-4.68],[-2.59,-4.69],[-2.79,-4.76],[-3.02,-4.91],[-2.93,-4.97],[-3.04,-4.97],[-3.08,-4.93],[-3.13,-4.95],[-3.15,-5.01],[-3.29,-4.99],[-3.39,-5.01],[-3.55,-4.97],[-3.75,-4.91],[-4.11,-5.01],[-4.24,-5.10],[-4.45,-5.17],[-4.54,-5.20],[-4.56,-5.40],[-4.63,-5.48],[-4.81,-5.61],[-4.95,-5.70],[-4.96,-5.79],[-4.86,-5.90],[-4.69,-5.84],[-4.49,-5.86],[-4.46,-6.10],[-4.47,-6.12],[-4.58,-6.23],[-4.63,-6.35],[-4.59,-6.51],[-4.45,-6.55],[-4.14,-6.64],[-4.07,-6.64],[-3.63,-6.55],[-3.56,-6.51],[-3.50,-6.55],[-3.46,-6.57],[-3.37,-6.51],[-3.25,-6.33],[-2.75,-5.67],[-2.67,-5.60],[-2.48,-5.57],[-2.44,-5.57]] },
{ name: '鄱阳湖', center: [11.62,3.22], poly: [[12.43,3.32],[12.46,3.59],[12.33,3.55],[12.31,3.54],[12.26,3.48],[12.11,3.46],[12.03,3.35],[12.03,3.52],[12.04,3.61],[11.97,3.76],[12.06,3.98],[12.12,4.11],[12.08,4.23],[12.07,4.44],[12.03,4.39],[11.90,4.34],[11.83,4.17],[11.71,4.33],[11.84,3.98],[11.79,4.00],[11.76,4.09],[11.64,4.26],[11.64,4.08],[11.64,3.87],[11.46,3.79],[11.30,3.70],[11.18,3.57],[10.97,3.41],[11.02,3.23],[11.08,3.17],[10.79,3.01],[10.67,3.23],[10.80,2.95],[10.90,2.80],[10.78,2.58],[10.98,2.48],[11.04,2.29],[11.11,2.11],[11.07,1.84],[11.07,1.71],[11.29,1.75],[11.42,1.83],[11.32,1.90],[11.28,2.09],[11.26,2.16],[11.22,2.33],[11.19,2.49],[11.02,2.61],[11.32,2.62],[11.30,2.81],[11.18,2.98],[11.16,3.11],[11.32,3.10],[11.43,3.17],[11.55,3.17],[11.63,3.11],[11.71,3.13],[11.63,3.32],[11.71,3.38],[11.76,3.27],[11.88,3.22],[11.86,3.11],[11.88,3.01],[12.00,3.09],[12.11,3.15],[12.15,3.07],[12.29,3.13],[12.34,3.07],[12.43,3.22],[12.29,3.33]] },
{ name: '洞庭湖', center: [7.95,3.60], poly: [[8.98,3.24],[9.04,3.19],[8.93,3.47],[8.95,3.58],[8.87,3.72],[8.75,3.76],[8.73,3.69],[8.80,3.64],[8.92,3.57],[8.76,3.56],[8.56,3.67],[8.47,3.67],[8.45,3.79],[8.34,3.86],[8.33,3.78],[8.29,3.76],[8.18,3.83],[8.03,3.86],[7.81,3.62],[7.72,3.61],[7.69,3.76],[7.67,3.69],[7.63,3.77],[7.67,3.89],[7.61,3.86],[7.60,3.89],[7.55,3.93],[7.56,3.85],[7.59,3.76],[7.56,3.77],[7.53,3.73],[7.46,3.83],[7.48,3.71],[7.39,3.74],[7.35,3.65],[7.37,3.62],[7.33,3.58],[7.27,3.54],[6.92,3.43],[6.86,3.27],[6.98,3.36],[7.25,3.42],[7.32,3.34],[7.39,3.21],[7.43,2.98],[7.55,3.16],[7.55,3.34],[7.61,3.63],[7.64,3.49],[7.74,3.48],[7.89,3.60],[7.92,3.70],[8.01,3.68],[8.03,3.60],[8.10,3.50],[8.32,3.49],[8.41,3.56],[8.51,3.54],[8.62,3.57],[8.84,3.42]] },
{ name: '太湖', center: [15.33,0.83], poly: [[16.02,1.15],[16.11,1.40],[15.97,1.48],[15.61,1.76],[15.19,1.87],[14.75,1.58],[14.56,1.40],[14.54,1.32],[14.53,1.21],[14.48,1.11],[14.45,0.93],[14.50,0.81],[14.66,0.50],[14.74,0.41],[14.73,0.32],[14.86,0.30],[14.93,0.28],[14.97,0.22],[15.04,0.19],[15.09,0.12],[15.16,0.10],[15.19,0.11],[15.26,0.11],[15.35,0.15],[15.32,0.19],[15.31,0.29],[15.29,0.24],[15.24,0.17],[15.22,0.21],[15.21,0.29],[15.22,0.49],[15.36,0.43],[15.49,0.32],[15.56,0.33],[15.64,0.37],[15.61,0.54],[15.55,0.60],[15.46,0.61],[15.39,0.74],[15.47,0.70],[15.54,0.72],[15.49,0.75],[15.48,0.81],[15.49,0.88],[15.55,0.91],[15.53,1.00],[15.74,1.00],[15.81,1.09],[15.69,1.29],[15.68,1.34],[15.60,1.33],[15.53,1.40],[15.47,1.48],[15.47,1.53],[15.56,1.61],[15.62,1.61],[15.67,1.56],[15.75,1.37],[15.85,1.31],[15.98,1.34]] },
{ name: '洪泽湖', center: [13.53,-1.36], poly: [[14.25,-1.35],[14.04,-1.36],[14.01,-1.17],[13.96,-1.05],[13.89,-0.96],[13.64,-0.74],[13.37,-0.69],[13.33,-0.63],[13.28,-0.51],[13.20,-0.57],[13.08,-0.51],[13.13,-0.64],[13.22,-0.71],[12.98,-0.79],[12.81,-0.62],[12.65,-0.43],[12.64,-0.55],[12.88,-0.88],[13.37,-0.74],[13.16,-1.23],[12.96,-1.28],[12.46,-1.22],[12.31,-0.89],[12.11,-1.00],[12.40,-1.19],[12.54,-1.39],[12.85,-1.38],[13.14,-1.45],[13.24,-1.01],[13.55,-0.77],[13.70,-0.96],[13.58,-1.00],[13.72,-1.12],[13.70,-1.32],[13.61,-1.28],[13.20,-1.47],[13.18,-1.70],[13.15,-1.95],[13.25,-1.67],[13.46,-1.62],[13.61,-1.95],[13.75,-1.97],[13.83,-2.11],[13.83,-1.90],[14.03,-1.86],[14.10,-1.92],[13.95,-2.03],[13.81,-2.33],[13.97,-2.70],[14.03,-2.68],[14.04,-2.56],[14.13,-2.45],[14.12,-2.19],[14.25,-2.16],[14.63,-1.96],[14.74,-1.82],[14.61,-1.54],[14.51,-1.33],[14.43,-1.08],[14.25,-1.05]] },
];

/* ===== 海域标注（营造世界地图氛围）===== */
const SEA_LABELS = [
    { name: '渤 海', lng: 119.8, lat: 38.9 },
    { name: '黄 海', lng: 123.5, lat: 35.8 },
    { name: '东 海', lng: 126.5, lat: 29 },
    { name: '台 湾 海 峡', lng: 119.3, lat: 24.3 },
    { name: '南 海', lng: 113.5, lat: 16.5 },
    { name: '太平洋', lng: 135, lat: 25 },
    { name: '孟加拉湾', lng: 89, lat: 16 }
];

/* ================= 坐标转换 ================= */
const LON_SCALE = Math.cos(35 * Math.PI / 180); // 纬度方向余弦修正，保持东西比例
const CENTER_LON = 104, CENTER_LAT = 32;  // 调整中心纬度以更好显示南海诸岛
const MAP_SCALE = 1.15;

function project(lng, lat) {
    return {
        x: (lng - CENTER_LON) * LON_SCALE * MAP_SCALE,
        y: (lat - CENTER_LAT) * MAP_SCALE
    };
}

/* ================= Three.js 场景 ================= */
const container = document.getElementById('container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1026);
scene.fog = new THREE.Fog(0x0b1026, 80, 160);

const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 500);
const HOME_POS = new THREE.Vector3(0, 48, 65);  // 提高相机高度以看到南海诸岛
camera.position.copy(HOME_POS);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
container.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(innerWidth, innerHeight);
labelRenderer.domElement.id = 'labels';
container.appendChild(labelRenderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI / 2.05;
controls.minDistance = 15;
controls.maxDistance = 120;
controls.enablePan = true;                 // 右键/双指平移
controls.screenSpacePanning = false;       // 沿地面平移更符合地图直觉
controls.autoRotate = true;
controls.autoRotateSpeed = 0.6;

/* 灯光 */
scene.add(new THREE.AmbientLight(0xffffff, 0.55));
const dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
dirLight.position.set(30, 60, 40);
scene.add(dirLight);
const fillLight = new THREE.DirectionalLight(0x6688cc, 0.35);
fillLight.position.set(-40, 20, -30);
scene.add(fillLight);

/* 海面底板（扩大到世界地图尺度） */
const seaGeo = new THREE.CircleGeometry(130, 72);
const seaMat = new THREE.MeshPhongMaterial({ color: 0x0e2a5e, transparent: true, opacity: 0.9 });
const sea = new THREE.Mesh(seaGeo, seaMat);
sea.rotation.x = -Math.PI / 2;
sea.position.y = -0.15;
scene.add(sea);

/* ================= 状态 ================= */
const provinceMeshes = [];       // 可拾取的省份 Mesh
const proxyMeshes = [];          // 小区域（港澳）不可见放大命中代理
let labelGroup, boundaryGroup, huanGroup, flightGroup;
let neighborGroup, seaLabelsGroup;   // 周边国家 / 海域标注
let topCitiesGroup;                  // 省内前三城市标注层
let hoveredMesh = null, selectedMesh = null;
let colorMode = 'terrain';       // terrain | gdp | pop
let flightDots = [];             // 飞行航线上的运动光点
const riverCurves = [];          // 河流曲线+顺流光点
const lakeRipples = [];          // 湖泊波纹环
let waterTime = 0;               // 水体动效时钟

/* ================= 加载地图数据 ================= */
async function loadGeoJSON() {
    for (const url of GEO_URLS) {
        try {
            const res = await fetch(url);
            if (!res.ok) continue;
            const data = await res.json();
            if (data && data.features) return data;
        } catch (e) { /* 尝试下一个源 */ }
    }
    throw new Error('所有地图数据源均不可用');
}

function buildProvinces(geojson) {
    const group = new THREE.Group();

    // 面积过小的省级区（港澳）加不可见放大命中代理，方便点选
    const SMALL_AREAS = { '香港特别行政区': 2.2, '澳门特别行政区': 1.6 };

    geojson.features.forEach(feature => {
        const name = feature.properties.name;
        const step = PROVINCE_STEP[name] || 3;
        const cfg = STEP_CONFIG[step];

        // 收集所有环（Polygon + MultiPolygon）
        const polygons = [];
        const geom = feature.geometry;
        if (geom.type === 'Polygon') polygons.push(geom.coordinates);
        else if (geom.type === 'MultiPolygon') geom.coordinates.forEach(c => polygons.push(c));

        polygons.forEach(rings => {
            const shape = new THREE.Shape();
            // 外环
            const outerPts = [];
            rings[0].forEach((pt, i) => {
                const p = project(pt[0], pt[1]);
                outerPts.push(p);
                if (i === 0) shape.moveTo(p.x, p.y);
                else shape.lineTo(p.x, p.y);
            });
            // 内环（孔洞）
            for (let i = 1; i < rings.length; i++) {
                const hole = new THREE.Path();
                rings[i].forEach((pt, j) => {
                    const p = project(pt[0], pt[1]);
                    if (j === 0) hole.moveTo(p.x, p.y);
                    else hole.lineTo(p.x, p.y);
                });
                shape.holes.push(hole);
            }

            const extrudeGeo = new THREE.ExtrudeGeometry(shape, {
                depth: cfg.height,
                bevelEnabled: false
            });
            const mat = new THREE.MeshPhongMaterial({
                color: cfg.color,
                shininess: 18,
                flatShading: false
            });
            const mesh = new THREE.Mesh(extrudeGeo, mat);
            mesh.userData = { name, step, baseColor: cfg.color };
            group.add(mesh);
            provinceMeshes.push(mesh);

            // 省份边界描线
            const edges = new THREE.EdgesGeometry(extrudeGeo, 30);
            const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.28 });
            const border = new THREE.LineSegments(edges, lineMat);
            mesh.add(border);

            // 面积过小（港澳）：加不可见放大命中代理，命中后映射回真实省份
            // 代理顶面略低于省顶，避免误抢邻省陆地命中，仅在近海/边缘扩大可点范围
            const factor = SMALL_AREAS[name];
            if (factor) {
                let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
                outerPts.forEach(p => {
                    minx = Math.min(minx, p.x); maxx = Math.max(maxx, p.x);
                    miny = Math.min(miny, p.y); maxy = Math.max(maxy, p.y);
                });
                const ph = cfg.height * 0.9;
                const proxy = new THREE.Mesh(
                    new THREE.BoxGeometry((maxx - minx) * factor, (maxy - miny) * factor, ph),
                    new THREE.MeshBasicMaterial({ visible: false })
                );
                proxy.position.set((minx + maxx) / 2, (miny + maxy) / 2, ph / 2);
                proxy.userData = { name, step, proxyOf: mesh };
                group.add(proxy);
                proxyMeshes.push(proxy);
            }
        });
    });

    // 平躺到 XZ 平面（shape.y → -z）
    group.rotation.x = -Math.PI / 2;
    scene.add(group);
}

/* ================= 阶梯分界线 ================= */
function buildBoundaryLine(points, color, label, labelTextPos) {
    const g = new THREE.Group();
    const vecs = points.map(p => {
        const q = project(p[0], p[1]);
        return new THREE.Vector3(q.x, 3.6, -q.y);
    });
    const curve = new THREE.CatmullRomCurve3(vecs);
    const tubeGeo = new THREE.TubeGeometry(curve, 120, 0.09, 6, false);
    const tubeMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 });
    g.add(new THREE.Mesh(tubeGeo, tubeMat));

    // 端点标注（类随主题换色）
    const div = document.createElement('div');
    div.className = 'label-boundary ' + (color === 0xff5252 ? 'b12' : 'b23');
    div.textContent = label;
    const tag = new CSS2DObject(div);
    const lp = project(labelTextPos[0], labelTextPos[1]);
    tag.position.set(lp.x, 4.2, -lp.y);
    g.add(tag);
    return g;
}

function buildBoundaries() {
    boundaryGroup = new THREE.Group();
    boundaryGroup.add(buildBoundaryLine(LINE_1_2, 0xff5252, '一/二级阶梯分界\n昆仑山—祁连山—横断山脉', [90, 37.5]));
    boundaryGroup.add(buildBoundaryLine(LINE_2_3, 0xffd75e, '二/三级阶梯分界\n大兴安岭—太行山—巫山—雪峰山', [114, 44]));
    scene.add(boundaryGroup);
}

/* ================= 胡焕庸线 ================= */
function buildHuanLine() {
    huanGroup = new THREE.Group();
    const vecs = LINE_HUAN.map(p => {
        const q = project(p[0], p[1]);
        return new THREE.Vector3(q.x, 4.2, -q.y);
    });
    const curve = new THREE.CatmullRomCurve3(vecs);
    const tubeGeo = new THREE.TubeGeometry(curve, 120, 0.08, 6, false);
    const tubeMat = new THREE.MeshBasicMaterial({ color: 0x9d6bff, transparent: true, opacity: 0.95 });
    huanGroup.add(new THREE.Mesh(tubeGeo, tubeMat));

    // 两端标注
    const mkTag = (lng, lat, text, dy) => {
        const div = document.createElement('div');
        div.className = 'label-huan';
        div.textContent = text;
        const tag = new CSS2DObject(div);
        const q = project(lng, lat);
        tag.position.set(q.x, 4.8 + (dy || 0), -q.y);
        huanGroup.add(tag);
    };
    mkTag(127.53, 50.25, '胡焕庸线·黑河端', 0.5);
    mkTag(98.49, 25.02, '腾冲端', 0);

    // 中部说明牌
    const div = document.createElement('div');
    div.className = 'label-huan-note';
    div.innerHTML = `东南 ${HUAN_INFO.eastPop}人口 · ${HUAN_INFO.eastArea}国土<br>西北 ${HUAN_INFO.westPop}人口 · ${HUAN_INFO.westArea}国土`;
    const midTag = new CSS2DObject(div);
    const mq = project(113.2, 28.5);
    midTag.position.set(mq.x + 3.2, 4.6, -mq.y);
    huanGroup.add(midTag);

    huanGroup.visible = false;
    setLayerVisible(huanGroup, false);
    scene.add(huanGroup);
}

/* ================= 风景名胜：名山 / 大江 / 湖泊 ================= */
let scenicGroup;   // 风景名胜图层组
const scenicMats = [];   // {mat, kind:'cone'|'river'|'lake', snow?, r?} 供主题联动

function buildScenicLayer() {
    scenicGroup = new THREE.Group();
    scenicMats.length = 0;
    lakeRipples.length = 0;
    const meshGroup = new THREE.Group();   // 与省份一致：X轴-90°平躺
    meshGroup.rotation.x = -Math.PI / 2;
    scenicGroup.add(meshGroup);

    /* 名山：锥体标记 + 名称海拔标签 */
    MOUNTAINS.forEach(([prov, mname, elev, lng, lat]) => {
        const step = PROVINCE_STEP[prov] || 3;
        const baseH = STEP_CONFIG[step].height;
        const p = project(lng, lat);
        const h = 0.5 + Math.min(Math.log10(Math.max(elev, 60)), 4) * 0.22; // 越高越醒目

        const coneMat = new THREE.MeshPhongMaterial({ color: elev > 4000 ? 0xcfd8e8 : 0x9c6b3c, shininess: 30 });
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.16, h, 6), coneMat);
        scenicMats.push({ mat: coneMat, kind: 'cone', snow: elev > 4000 });
        cone.position.set(p.x, p.y, baseH + h / 2);
        meshGroup.add(cone);

        const div = document.createElement('div');
        div.className = 'label-mountain';
        div.textContent = '⛰ ' + mname + ' ' + elev + 'm';
        const tag = new CSS2DObject(div);
        tag.position.set(p.x, baseH + h + 0.35, -p.y);
        scenicGroup.add(tag);
    });

    /* 大江：贴地曲线管 + 名称标注 + 顺流光点 */
    riverCurves.length = 0;
    RIVERS.forEach(r => {
        // 世界坐标：x=经度投影, y=地形顶面+抬升, z=-纬度投影（与省份/湖泊一致）
        const vecs = r.pts.map(pt => {
            const q = project(pt[0], pt[1]);
            return new THREE.Vector3(q.x, terrainTopAt(pt[0], pt[1]) + 0.15, -q.y);
        });
        const curve = new THREE.CatmullRomCurve3(vecs);
        riverCurves.push({ curve, speed: 0.03, dots: [] });
        // 顺流光点：8 个，首亮尾暗
        for (let i = 0; i < 8; i++) {
            const dotMat = new THREE.MeshBasicMaterial({ color: 0xbfe6ff, transparent: true, opacity: 1 - i * 0.11 });
            const dot = new THREE.Mesh(new THREE.SphereGeometry(0.22 - i * 0.012, 8, 8), dotMat);
            scenicMats.push({ mat: dotMat, kind: 'flowdot' });
            scenicGroup.add(dot);
            riverCurves[riverCurves.length - 1].dots.push({ obj: dot, offset: i * 0.045 });
        }
        const tubeMat = new THREE.MeshBasicMaterial({ color: r.color, transparent: true, opacity: 0.9 });
        const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 200, 0.12, 6, false), tubeMat);
        scenicMats.push({ mat: tubeMat, kind: 'river', r });
        scenicGroup.add(tube);

        const mid = r.pts[Math.floor(r.pts.length * 0.6)];
        const q = project(mid[0], mid[1]);
        const div = document.createElement('div');
        div.className = 'label-river';
        div.textContent = r.name;
        const tag = new CSS2DObject(div);
        tag.position.set(q.x, terrainTopAt(mid[0], mid[1]) + 0.6, -q.y);
        scenicGroup.add(tag);
    });

    /* 湖泊：真实轮廓水面 + 名称 + 微波纹 */
    LAKES.forEach(lk => {
        // 轮廓 bbox 四角+中心取地形高度最大值，防埋
        const xs = lk.poly.map(p => p[0]), zs = lk.poly.map(p => p[1]);
        const minX = Math.min(...xs), maxX = Math.max(...xs), minZ = Math.min(...zs), maxZ = Math.max(...zs);
        const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
        // 页面投影的逆变换：x=(lng-CENTER_LON)*LON_SCALE*MAP_SCALE, z=-(lat-CENTER_LAT)*MAP_SCALE
        const projBack = (x, z) => [x / (LON_SCALE * MAP_SCALE) + CENTER_LON, CENTER_LAT - z / MAP_SCALE];
        const cand = [[minX, minZ], [maxX, minZ], [minX, maxZ], [maxX, maxZ], [cx, cz]]
            .map(p => terrainTopAt(...projBack(p[0], p[1])));
        const top = Math.max(...cand);

        const shape = new THREE.Shape();
        lk.poly.forEach(([x, z], i) => { i === 0 ? shape.moveTo(x, -z) : shape.lineTo(x, -z); });
        shape.closePath();
        const lakeMat = new THREE.MeshBasicMaterial({ color: 0x3d9be0, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
        const lake = new THREE.Mesh(new THREE.ShapeGeometry(shape), lakeMat);
        scenicMats.push({ mat: lakeMat, kind: 'lake' });
        lake.rotation.x = -Math.PI / 2;   // 与 meshGroup 一致：Shape 的 y 轴映射到世界 -z
        lake.position.y = top + 0.12;
        scenicGroup.add(lake);

        // 微波纹：2 个交替扩张淡出的环
        const rEq = Math.max(maxX - minX, maxZ - minZ) * 0.32;
        for (let i = 0; i < 2; i++) {
            const ripMat = new THREE.MeshBasicMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0, side: THREE.DoubleSide });
            const rip = new THREE.Mesh(new THREE.RingGeometry(0.94, 1, 40), ripMat);
            rip.rotation.x = -Math.PI / 2;
            rip.position.set(cx, top + 0.18, cz);
            rip.scale.setScalar(0.5);
            scenicMats.push({ mat: ripMat, kind: 'ripple' });
            lakeRipples.push({ obj: rip, mat: ripMat, rEq, phase: i * 0.5 });
            scenicGroup.add(rip);
        }

        const div = document.createElement('div');
        div.className = 'label-lake';
        div.textContent = lk.name;
        const tag = new CSS2DObject(div);
        tag.position.set(cx, top + 0.5, cz);
        scenicGroup.add(tag);
    });

    scene.add(scenicGroup);
}

/* 经纬度→地形顶面高度：命中省份则取其阶梯高，否则0 */
function terrainTopAt(lng, lat) {
    const q = project(lng, lat);
    const ray = new THREE.Raycaster(new THREE.Vector3(q.x, 60, -q.y), new THREE.Vector3(0, -1, 0));
    const hits = ray.intersectObjects(provinceMeshes, false);
    return hits.length ? hits[0].point.y : 0;
}

/* ================= 周边国家 + 海域标注 ================= */
async function buildNeighborCountries() {
    neighborGroup = new THREE.Group();
    seaLabelsGroup = new THREE.Group();
    // 网格子组：挤出体需绕 X 轴 -90° 平躺到 XZ 平面（与省份一致）
    const meshGroup = new THREE.Group();
    meshGroup.rotation.x = -Math.PI / 2;
    neighborGroup.add(meshGroup);
    scene.add(neighborGroup);
    scene.add(seaLabelsGroup);

    try {
        const res = await fetch(WORLD_GEO_URL);
        const world = await res.json();
        const countryMap = {};
        NEIGHBOR_COUNTRIES.forEach(c => { countryMap[c.en] = c; });

        world.features.forEach(f => {
            const name = f.properties && f.properties.name;
            const info = countryMap[name];
            if (!info) return;   // 只绘制邻国，跳过中国本体与其余国家

            const polygons = [];
            if (f.geometry.type === 'Polygon') polygons.push(f.geometry.coordinates);
            else if (f.geometry.type === 'MultiPolygon') f.geometry.coordinates.forEach(c => polygons.push(c));

            polygons.forEach(rings => {
                const shape = new THREE.Shape();
                rings[0].forEach((pt, i) => {
                    const p = project(pt[0], pt[1]);
                    if (i === 0) shape.moveTo(p.x, p.y); else shape.lineTo(p.x, p.y);
                });
                for (let i = 1; i < rings.length; i++) {
                    const hole = new THREE.Path();
                    rings[i].forEach((pt, j) => {
                        const p = project(pt[0], pt[1]);
                        if (j === 0) hole.moveTo(p.x, p.y); else hole.lineTo(p.x, p.y);
                    });
                    shape.holes.push(hole);
                }
                const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.22, bevelEnabled: false });
                const mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({
                    color: 0x27374f, shininess: 6, transparent: true, opacity: 0.92
                }));
                meshGroup.add(mesh);

                const edges = new THREE.EdgesGeometry(geo, 30);
                const border = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x5b7699, transparent: true, opacity: 0.35 }));
                mesh.add(border);
            });

            // 国名标签（世界坐标）
            const div = document.createElement('div');
            div.className = 'label-country';
            div.textContent = info.zh;
            const tag = new CSS2DObject(div);
            const lp = project(info.labelLng, info.labelLat);
            tag.position.set(lp.x, 0.6, -lp.y);
            neighborGroup.add(tag);

            // 首都标注（星形符号，世界坐标）
            const cp = project(info.capLng, info.capLat);
            const capDiv = document.createElement('div');
            capDiv.className = 'label-cap';
            capDiv.textContent = '★ ' + info.cap;
            const capTag = new CSS2DObject(capDiv);
            capTag.position.set(cp.x, 0.9, -cp.y);
            neighborGroup.add(capTag);
        });
    } catch (e) {
        console.warn('周边国家边界加载失败，仅显示海域标注：', e.message);
    }

    // 海域名称标注（蓝色，营造世界地图氛围）
    SEA_LABELS.forEach(s => {
        const div = document.createElement('div');
        div.className = 'label-sea';
        div.textContent = s.name;
        const tag = new CSS2DObject(div);
        const p = project(s.lng, s.lat);
        tag.position.set(p.x, 0.25, -p.y);
        seaLabelsGroup.add(tag);
    });
}

/* ================= 省内经济前三城市 ================= */
function clearTopCities() {
    if (!topCitiesGroup) return;
    // remove 只对被移除对象触发 removed 事件，子级 CSS2D 标签的 DOM 不会自动清理，
    // 必须先手动移除，否则标签残留在页面上
    [...topCitiesGroup.children].forEach(g => {
        g.traverse(o => {
            if (o.isCSS2DObject && o.element && o.element.parentNode) {
                o.element.parentNode.removeChild(o.element);
            }
        });
        topCitiesGroup.remove(g);
    });
}
function showTopCities(name) {
    clearTopCities();
    const cities = PROVINCE_TOP_CITIES[name];
    if (!cities) return;
    const step = PROVINCE_STEP[name] || 3;
    const baseY = STEP_CONFIG[step].height;

    cities.forEach((c, idx) => {
        const p = project(c.lng, c.lat);
        const g = new THREE.Group();
        g.position.set(p.x, baseY + 0.15, -p.y);

        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.13, 12, 12),
            new THREE.MeshBasicMaterial({ color: 0xff9e6b })
        );
        g.add(sphere);

        const div = document.createElement('div');
        div.className = 'label-topcity';
        div.textContent = (idx + 1) + '. ' + c.n + ' ⛰' + c.e + 'm';
        const tag = new CSS2DObject(div);
        tag.position.set(0, 0.45, 0);
        g.add(tag);
        topCitiesGroup.add(g);
    });
}
function hideTopCities() { clearTopCities(); }

/* ================= 城市间飞行航线 ================= */
const CITY_COORD = {};
CAPITALS.concat(SUB_CITIES).forEach(c => { CITY_COORD[c.name] = c; });

function cityHeight(name) {
    const c = CITY_COORD[name];
    if (!c) return STEP_CONFIG[3].height;
    const CITY_PROV_FULL = {
        '北京': '北京市', '天津': '天津市', '上海': '上海市', '重庆': '重庆市',
        '香港': '香港特别行政区', '澳门': '澳门特别行政区'
    };
    const provFull = CITY_PROV_FULL[c.name] || (c.prov ? Object.keys(PROVINCE_STEP).find(k => k.startsWith(c.prov)) : null);
    return STEP_CONFIG[(provFull && PROVINCE_STEP[provFull]) || 3].height;
}

function buildFlightRoutes() {
    flightGroup = new THREE.Group();
    flightDots = [];

    FLIGHT_ROUTES.forEach(route => {
        const a = CITY_COORD[route.from], b = CITY_COORD[route.to];
        if (!a || !b) return;
        const pa = project(a.lng, a.lat), pb = project(b.lng, b.lat);
        const start = new THREE.Vector3(pa.x, cityHeight(a.name) + 0.4, -pa.y);
        const end = new THREE.Vector3(pb.x, cityHeight(b.name) + 0.4, -pb.y);

        // 拱形控制点：中点上方抬升
        const mid = start.clone().add(end).multiplyScalar(0.5);
        const dist = start.distanceTo(end);
        mid.y += Math.max(3, dist * 0.28);
        const curve = new THREE.QuadraticBezierCurve3(start, mid, end);

        const pts = curve.getPoints(60);
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const mat = new THREE.LineBasicMaterial({ color: route.color, transparent: true, opacity: 0.5 });
        flightGroup.add(new THREE.Line(geo, mat));

        // 运动光点
        const dot = new THREE.Mesh(
            new THREE.SphereGeometry(0.14, 10, 10),
            new THREE.MeshBasicMaterial({ color: route.color })
        );
        flightGroup.add(dot);
        flightDots.push({ curve, dot, t: Math.random(), speed: 0.0025 + Math.random() * 0.0015 });
    });

    flightGroup.visible = false;
    setLayerVisible(flightGroup, false);
    scene.add(flightGroup);
}

function updateFlight() {
    if (!flightGroup || !flightGroup.visible) return;
    flightDots.forEach(f => {
        f.t += f.speed;
        if (f.t > 1) f.t = 0;
        const p = f.curve.getPoint(f.t);
        f.dot.position.copy(p);
    });
}

/* ================= 主题（暗色 / 亮色·纸张地图风） ================= */
let themeMode = 'dark';
try { themeMode = localStorage.getItem('terrain_theme') || 'dark'; } catch (e) {}

const THEMES = {
    dark: {
        bg: 0x0b1026, sea: 0x0e2a5e, neighbor: 0x27374f, neighborEdge: 0x5b7699,
        terrain: { 1: 0xb5651d, 2: 0xe8a33d, 3: 0x5faf5f },
        gdpFrom: 0x1a3a5f, gdpTo: 0xffb830, popFrom: 0x2a5f4f, popTo: 0xff5a3c
    },
    light: {
        bg: 0xf6f1e5, sea: 0xcddfe3, neighbor: 0xe3dcc9, neighborEdge: 0xc2b493,
        terrain: { 1: 0xc07a3b, 2: 0xe0b054, 3: 0x8fae6b },
        gdpFrom: 0xd9c9a3, gdpTo: 0xb35a10, popFrom: 0xcfdcc9, popTo: 0xc74a26
    }
};
const T = () => THEMES[themeMode];
function getTerrainColor(step) { return T().terrain[step] ?? 0x888888; }

/* ================= 数据着色模式 ================= */
const GDP_MAX = 145800, POP_MAX = 12859;
const NATIONAL_GDP = 1400000;   // 2025年全国GDP约140万亿（亿元）
const NATIONAL_POP = 140489;    // 2025年末全国人口（万人）

// GDP / 人口渐变色（端色随主题变化，保证亮底可读性）
function gdpColor(v) {
    const t = Math.pow(v / GDP_MAX, 0.55);
    return new THREE.Color(T().gdpFrom).lerp(new THREE.Color(T().gdpTo), t);
}
function popColor(v) {
    const t = Math.pow(v / POP_MAX, 0.55);
    return new THREE.Color(T().popFrom).lerp(new THREE.Color(T().popTo), t);
}

// 图例动态生成（色块随当前主题取色）
const hex6 = h => '#' + new THREE.Color(h).getHexString();
function legendHTML(mode) {
    const t = T();
    if (mode === 'terrain') return `
        <div class="legend-item"><div class="legend-color" style="background:${hex6(t.terrain[1])}"></div>第一级阶梯（青藏高原，均高&gt;4000m）</div>
        <div class="legend-item"><div class="legend-color" style="background:${hex6(t.terrain[2])}"></div>第二级阶梯（高原/盆地，1000~2000m）</div>
        <div class="legend-item"><div class="legend-color" style="background:${hex6(t.terrain[3])}"></div>第三级阶梯（平原/丘陵，&lt;500m）</div>`;
    if (mode === 'gdp') return `
        <div class="legend-item" style="margin-bottom:8px;font-weight:bold">GDP 总量（2025年，亿元）</div>
        <div class="legend-item"><div class="legend-color" style="background:${hex6(t.gdpTo)}"></div>≈14.6 万亿（广东，最高）</div>
        <div class="legend-item"><div class="legend-color" style="background:${hex6(new THREE.Color(t.gdpFrom).lerp(new THREE.Color(t.gdpTo), 0.5).getHex())}"></div>≈5 万亿</div>
        <div class="legend-item"><div class="legend-color" style="background:${hex6(t.gdpFrom)}"></div>＜1 千亿（西藏最低）</div>`;
    return `
        <div class="legend-item" style="margin-bottom:8px;font-weight:bold">常住人口（2025年末，万人）</div>
        <div class="legend-item"><div class="legend-color" style="background:${hex6(t.popTo)}"></div>≈1.29 亿（广东，最多）</div>
        <div class="legend-item"><div class="legend-color" style="background:${hex6(new THREE.Color(t.popFrom).lerp(new THREE.Color(t.popTo), 0.5).getHex())}"></div>≈5000 万</div>
        <div class="legend-item"><div class="legend-color" style="background:${hex6(t.popFrom)}"></div>＜1000 万（澳门最少）</div>`;
}

function applyColorMode(mode) {
    colorMode = mode;
    provinceMeshes.forEach(mesh => {
        const name = mesh.userData.name;
        const d = PROVINCE_DATA[name];
        let hex;
        if (mode === 'terrain') {
            hex = getTerrainColor(mesh.userData.step);
        } else if (mode === 'gdp') {
            hex = (d && d.gdp != null) ? gdpColor(d.gdp).getHex() : (themeMode === 'dark' ? 0x333a4d : 0xc9c2b0);
        } else {
            hex = (d && d.pop != null) ? popColor(d.pop).getHex() : (themeMode === 'dark' ? 0x333a4d : 0xc9c2b0);
        }
        mesh.userData.currentBase = hex;
        mesh.material.color.setHex(hex);
    });
    // 图例同步更新
    document.getElementById('legendBody').innerHTML = legendHTML(mode);
    // 清除选中高亮与城市标注（切换模式时避免残留）
    selectedMesh = null;
    hideDetail();
    hideTopCities();
}

/* 主题切换：换背景/海面/邻国/阶梯色与灯光，并重刷当前着色模式 */
function applyTheme(mode) {
    themeMode = mode;
    try { localStorage.setItem('terrain_theme', mode); } catch (e) {}
    const t = T();
    document.body.classList.toggle('light', mode === 'light');
    scene.background = new THREE.Color(t.bg);
    if (scene.fog) scene.fog.color.setHex(t.bg);
    sea.material.color.setHex(t.sea);
    if (neighborGroup) {
        neighborGroup.traverse(o => {
            if (o.isMesh && o.material && o.material.color) {
                o.material.color.setHex(t.neighbor);
                o.material.transparent = true;
                o.material.opacity = mode === 'light' ? 1 : 0.92;
            }
            if (o.isLineSegments && o.material) o.material.color.setHex(t.neighborEdge);
        });
    }
    // 省份描边线：亮色改深棕
    provinceMeshes.forEach(m => m.children.forEach(o => {
        if (o.isLineSegments && o.material) {
            o.material.color.setHex(mode === 'light' ? 0x9c7c46 : 0xffffff);
            o.material.opacity = mode === 'light' ? 0.5 : 0.28;
        }
    }));
    // 阶梯分界线管：亮色加深保证对比
    if (boundaryGroup) boundaryGroup.traverse(o => {
        if (o.isMesh && o.material) {
            const h = o.material.color.getHex();
            if (h === 0xff5252 || h === 0xd84343) o.material.color.setHex(mode === 'light' ? 0xd84343 : 0xff5252);
            else if (h === 0xffd75e || h === 0xb07d10) o.material.color.setHex(mode === 'light' ? 0xb07d10 : 0xffd75e);
        }
    });
    // 胡焕庸线管
    if (huanGroup) huanGroup.traverse(o => {
        if (o.isMesh && o.material) {
            const h = o.material.color.getHex();
            if (h === 0x9d6bff || h === 0x7c4fd0) o.material.color.setHex(mode === 'light' ? 0x7c4fd0 : 0x9d6bff);
        }
    });
    // 风景名胜材质随主题换色
    scenicMats.forEach(item => {
        if (item.kind === 'cone') item.mat.color.setHex(mode === 'light' ? (item.snow ? 0x7d8ca3 : 0x6b4a2a) : (item.snow ? 0xcfd8e8 : 0x9c6b3c));
        else if (item.kind === 'river') item.mat.color.setHex(mode === 'light' ? item.r.light : item.r.color);
        else if (item.kind === 'lake') item.mat.color.setHex(mode === 'light' ? 0x4a90c4 : 0x3d9be0);
        else if (item.kind === 'flowdot' || item.kind === 'ripple') item.mat.color.setHex(mode === 'light' ? 0x2a6f9e : 0xbfe6ff);
    });
    // 灯光：亮色下降低方向光强度避免过曝
    dirLight.intensity = mode === 'light' ? 0.75 : 1.1;
    fillLight.intensity = mode === 'light' ? 0.2 : 0.35;
    applyColorMode(colorMode);
    document.getElementById('btnTheme').textContent = mode === 'light' ? '🌙 暗色调' : '🌞 亮色调';
}

/* ================= 省份详情面板 ================= */
const detailEl = document.getElementById('detail');
function fmtGdp(v) {
    if (v == null) return '暂无数据';
    return v >= 10000 ? (v / 10000).toFixed(2) + ' 万亿元' : v.toLocaleString() + ' 亿元';
}
function fmtPop(v) {
    if (v == null) return '暂无数据';
    return v >= 10000 ? (v / 10000).toFixed(2) + ' 亿人' : v.toLocaleString() + ' 万人';
}
function showDetail(name) {
    const d = PROVINCE_DATA[name];
    const stepCfg = STEP_CONFIG[PROVINCE_STEP[name] || 3];
    document.getElementById('dName').textContent = name;
    document.getElementById('dStep').textContent = stepCfg.name + ' · ' + stepCfg.desc;
    document.getElementById('dGdp').textContent = fmtGdp(d ? d.gdp : null);
    document.getElementById('dPop').textContent = fmtPop(d ? d.pop : null);
    document.getElementById('dCapital').textContent = d ? d.capital : '--';

    const gdpPct = (d && d.gdp != null) ? (d.gdp / NATIONAL_GDP * 100) : 0;
    const popPct = (d && d.pop != null) ? (d.pop / NATIONAL_POP * 100) : 0;
    document.getElementById('dGdpPct').textContent = (d && d.gdp != null) ? gdpPct.toFixed(1) + '%' : '--';
    document.getElementById('dPopPct').textContent = (d && d.pop != null) ? popPct.toFixed(1) + '%' : '--';
    document.getElementById('dGdpBar').style.width = Math.min(gdpPct, 100) + '%';
    document.getElementById('dPopBar').style.width = Math.min(popPct, 100) + '%';

    // 省内经济前三城市（直辖市/特别行政区显示为"市内经济前三区"）
    const citiesEl = document.getElementById('dCities');
    const isMuni = ['北京市', '上海市', '天津市', '重庆市', '香港特别行政区', '澳门特别行政区'].includes(name);
    document.getElementById('dCitiesTitle').textContent = isMuni ? '🏙️ 市内经济前三区' : '🏙️ 省内经济前三城市';
    const cities = PROVINCE_TOP_CITIES[name];
    if (cities && cities.length) {
        citiesEl.innerHTML = cities.map((c, i) => `
            <div class="d-city">
                <span class="c-name"><span class="rank">${i + 1}</span>${c.n}</span>
                <span class="c-meta">⛰${c.e}m${c.g != null ? ' · ' + fmtGdp(c.g) : ''}${c.inc != null ? ' · 月入' + (c.inc / 10000).toFixed(1) + '万港元' : ''}</span>
            </div>`).join('')
            + (PROVINCE_TOP_META[name] ? `<div class="d-none">${PROVINCE_TOP_META[name]}</div>` : '');
    } else {
        citiesEl.innerHTML = '<div class="d-none">暂无城市数据</div>';
    }

    detailEl.classList.add('show');
}
function hideDetail() {
    detailEl.classList.remove('show');
}

/* ================= 城市标注 ================= */
function makeMarker(city, color, size, labelClass, yOffset) {
    const g = new THREE.Group();
    const q = project(city.lng, city.lat);
    g.position.set(q.x, yOffset, -q.y);

    const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(size, 16, 16),
        new THREE.MeshBasicMaterial({ color })
    );
    g.add(sphere);

    // 立柱
    const poleGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.6, 6);
    const pole = new THREE.Mesh(poleGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6 }));
    pole.position.y = -0.8;
    g.add(pole);

    const div = document.createElement('div');
    div.className = labelClass;
    div.textContent = city.name + (city.sub ? '★' : '');
    const tag = new CSS2DObject(div);
    tag.position.set(0, 1.0, 0);
    g.add(tag);
    return g;
}

function buildCities() {
    labelGroup = new THREE.Group();

    CAPITALS.forEach(c => {
        const step = c.prov ? (PROVINCE_STEP[Object.keys(PROVINCE_STEP).find(k => k.startsWith(c.prov))] || 3) : 3;
        const y = STEP_CONFIG[step].height;
        labelGroup.add(makeMarker(c, 0xffd75e, 0.32, 'label-capital', y + 0.4));
    });

    SUB_CITIES.forEach(c => {
        labelGroup.add(makeMarker(c, 0x4ac6ff, 0.28, 'label-sub', STEP_CONFIG[3].height + 0.4));
    });

    scene.add(labelGroup);
}

/* ================= 交互 ================= */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltip = document.getElementById('tooltip');

function onPointerMove(e) {
    mouse.x = (e.clientX / innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    // 两段拾取：真实省份优先；代理仅在无省份覆盖的区域（扩大的近海）生效，
    // 避免低视角下代理误抢邻省陆地命中
    const hits = raycaster.intersectObjects(provinceMeshes, false);
    const proxyHits = hits.length ? [] : raycaster.intersectObjects(proxyMeshes, false);

    // 还原上一个 hover
    if (hoveredMesh && hoveredMesh !== selectedMesh) {
        hoveredMesh.material.color.setHex(hoveredMesh.userData.currentBase ?? hoveredMesh.userData.baseColor);
    }

    if (hits.length > 0 || proxyHits.length > 0) {
        const mesh = proxyHits.length ? proxyHits[0].object.userData.proxyOf : hits[0].object;
        hoveredMesh = mesh;
        if (mesh !== selectedMesh) {
            mesh.material.color.setHex(mesh.userData.currentBase ?? mesh.userData.baseColor);
            mesh.material.color.offsetHSL(0, 0.05, 0.18);
        }
        const cfg = STEP_CONFIG[mesh.userData.step];
        const d = PROVINCE_DATA[mesh.userData.name];
        tooltip.style.display = 'block';
        tooltip.style.left = (e.clientX + 16) + 'px';
        tooltip.style.top = (e.clientY + 16) + 'px';
        tooltip.innerHTML = `
            <div class="tt-name">${mesh.userData.name}</div>
            <div class="tt-row">🗻 所属阶梯：${cfg.name}</div>
            <div class="tt-row">💰 GDP：${fmtGdp(d ? d.gdp : null)}</div>
            <div class="tt-row">👥 人口：${fmtPop(d ? d.pop : null)}</div>
            <div class="tt-row tt-hint">📖 ${cfg.desc} · 点击查看详情</div>
        `;
        document.body.style.cursor = 'pointer';
    } else {
        hoveredMesh = null;
        tooltip.style.display = 'none';
        document.body.style.cursor = 'default';
    }
}

function clearSelection() {
    if (selectedMesh) selectedMesh.material.color.setHex(selectedMesh.userData.currentBase ?? selectedMesh.userData.baseColor);
    selectedMesh = null;
    hideDetail();
    hideTopCities();
}

function onClick(e) {
    if (hoveredMesh) {
        // 再次点击已选中的省份 → 反选并关闭面板
        if (selectedMesh === hoveredMesh) { clearSelection(); return; }
        if (selectedMesh) selectedMesh.material.color.setHex(selectedMesh.userData.currentBase ?? selectedMesh.userData.baseColor);
        selectedMesh = hoveredMesh;
        selectedMesh.material.color.setHex(0xff6b6b);
        controls.autoRotate = false;
        document.getElementById('btnRotate').classList.remove('active');
        showDetail(selectedMesh.userData.name);
        showTopCities(selectedMesh.userData.name);
    }
}

renderer.domElement.addEventListener('pointermove', onPointerMove);
renderer.domElement.addEventListener('click', onClick);

/* ================= 控制按钮 ================= */
const btnLabels = document.getElementById('btnLabels');
const btnBoundaries = document.getElementById('btnBoundaries');
const btnRotate = document.getElementById('btnRotate');
const btnHuan = document.getElementById('btnHuan');
const btnFlight = document.getElementById('btnFlight');

/* three r160 的 CSS2DRenderer 不继承父组 visible，需下推到每个对象（含标签） */
function setLayerVisible(group, visible) {
    group.visible = visible;
    group.traverse(o => { o.visible = visible; });
}

btnLabels.onclick = () => {
    if (!labelGroup) return;
    setLayerVisible(labelGroup, !labelGroup.visible);
    btnLabels.classList.toggle('active', labelGroup.visible);
};
btnBoundaries.onclick = () => {
    if (!boundaryGroup) return;
    setLayerVisible(boundaryGroup, !boundaryGroup.visible);
    btnBoundaries.classList.toggle('active', boundaryGroup.visible);
};
btnHuan.onclick = () => {
    if (!huanGroup) return;
    setLayerVisible(huanGroup, !huanGroup.visible);
    btnHuan.classList.toggle('active', huanGroup.visible);
};
btnFlight.onclick = () => {
    if (!flightGroup) return;
    setLayerVisible(flightGroup, !flightGroup.visible);
    btnFlight.classList.toggle('active', flightGroup.visible);
};
document.getElementById('btnNeighbors').onclick = function () {
    const show = !(neighborGroup && neighborGroup.visible);
    if (neighborGroup) setLayerVisible(neighborGroup, show);
    if (seaLabelsGroup) setLayerVisible(seaLabelsGroup, show);
    this.classList.toggle('active', show);
};
document.getElementById('btnScenic').onclick = function () {
    const show = !(scenicGroup && scenicGroup.visible);
    if (scenicGroup) setLayerVisible(scenicGroup, show);
    this.classList.toggle('active', show);
};
btnRotate.onclick = () => {
    controls.autoRotate = !controls.autoRotate;
    btnRotate.classList.toggle('active', controls.autoRotate);
};
document.getElementById('btnReset').onclick = () => {
    camera.position.copy(HOME_POS);
    controls.target.set(0, 0, 0);
};

/* 着色模式切换 */
const modeButtons = { terrain: 'modeTerrain', gdp: 'modeGdp', pop: 'modePop' };
Object.entries(modeButtons).forEach(([mode, id]) => {
    document.getElementById(id).onclick = () => {
        applyColorMode(mode);
        Object.values(modeButtons).forEach(bid => document.getElementById(bid).classList.remove('active'));
        document.getElementById(id).classList.add('active');
    };
});

/* 详情面板关闭 */
document.getElementById('detailClose').onclick = clearSelection;

/* 图例面板折叠 */
document.getElementById('panelToggle').onclick = function () {
    const panel = document.getElementById('panel');
    panel.classList.toggle('collapsed');
    this.querySelector('.panel-toggle').textContent = panel.classList.contains('collapsed') ? '▶ 展开' : '▼ 收起';
};

/* 主题切换按钮 */
document.getElementById('btnTheme').onclick = () => {
    applyTheme(themeMode === 'light' ? 'dark' : 'light');
};

window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    labelRenderer.setSize(innerWidth, innerHeight);
});

/* ================= 启动 ================= */
async function init() {
    const loadingText = document.getElementById('loadingText');
    try {
        loadingText.textContent = '正在加载中国地图边界数据…';
        const geojson = await loadGeoJSON();
        loadingText.textContent = '正在构建三维地形与周边国家…';
        buildProvinces(geojson);
        scene.updateMatrixWorld(true);   // 先更新世界矩阵，风景名胜层取地形高度才准确
        topCitiesGroup = new THREE.Group();
        scene.add(topCitiesGroup);
        buildScenicLayer();
        await buildNeighborCountries();
        buildBoundaries();
        buildHuanLine();
        buildFlightRoutes();
        buildCities();
        applyTheme(themeMode);   // 应用记忆的明暗主题（内部会刷当前着色模式）
        document.getElementById('loading').style.display = 'none';
        animate();
    } catch (err) {
        loadingText.textContent = '⚠️ 地图数据加载失败，请检查网络后刷新重试（' + err.message + '）';
        console.error(err);
    }
}

/* 水体动效：河流顺流光点 + 湖泊微波纹 */
function updateWater(dt) {
    if (!scenicGroup || !scenicGroup.visible) return;
    waterTime += dt;
    riverCurves.forEach(rc => {
        rc.dots.forEach(d => {
            let t = (waterTime * rc.speed + 1 - d.offset) % 1;   // 源→口方向前进
            const p = rc.curve.getPointAt(t);
            d.obj.position.set(p.x, p.y + 0.12, p.z);
        });
    });
    lakeRipples.forEach(rp => {
        const k = (waterTime * 0.35 + rp.phase) % 1;             // 0→1 扩张淡出
        rp.obj.scale.setScalar(Math.max(rp.rEq * (0.15 + 0.85 * k), 0.01));
        rp.mat.opacity = 0.45 * (1 - k);
    });
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    updateFlight();
    updateWater(1 / 60);
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

init();

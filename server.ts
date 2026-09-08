import express, { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy Gemini Client initialization
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// System prompt for Hardware Architecture generation
const SYSTEM_PROMPT = `
You are the Chief Hardware Architect & Industrial Designer for "云端造物" (Cloud Maker / Design by Result).
Your task is to take a user's natural language hardware idea or iteration request, and generate an architecturally sound, realistic, manufacturable hardware blueprint in strict JSON format.

Hardware principles:
1. Prefer modern, accessible maker chips (ESP32-S3, RP2040, STM32, Nordic nRF52840, Raspberry Pi CM4 where appropriate).
2. Pinouts, buses (I2C, I2S, SPI, UART, DVP, GPIO), power rails (3.3V, 5V, LiPo 3.7V/TP4056), and sensors must be accurate and compatible.
3. BOM pricing should be realistic RMB (¥) estimates for hobbyist / small-batch maker modules.
4. If this is an iteration of an existing project, increment version (e.g. V1.0 -> V1.1 -> V1.2), incorporate the requested modifications, add/modify components & abilities, and detail the diff.

Return pure JSON matching this TypeScript structure:
{
  "title": string,
  "desc": string,
  "version": string, // e.g. "V1.2"
  "modelType": "robot" | "plant_monitor" | "speaker" | "custom_device" | "wearable",
  "abilities": [
    {
      "id": string,
      "title": string, // e.g. "能听到用户说话"
      "desc": string,
      "implementation": string, // e.g. "实现：双麦克风阵列 + 降噪引擎"
      "icon": "mic" | "message-square" | "eye" | "smile" | "hand" | "wifi" | "thermometer" | "volume-2" | "zap" | "activity"
    }
  ],
  "components": [
    {
      "id": string, // "M01", "M02", etc.
      "name": string, // e.g. "主控核心板"
      "model": string, // e.g. "ESP32-S3-WROOM-1 (16MB)"
      "quantity": number,
      "bus": string, // e.g. "System", "DVP / I2C", "I2S", "I2C (0x3C)", "Power 3.7V", "Mechanical"
      "price": number, // in RMB, e.g. 28.00
      "function": string,
      "highlightKey": "head" | "screen" | "base" | "arm_left" | "arm_right" | "sensor" | "speaker" | "camera" | "battery" | "pcb"
    }
  ],
  "specs": {
    "dimensions": string, // e.g. "82 x 76 x 95 mm"
    "weight": string, // e.g. "195g"
    "battery": string, // e.g. "3.7V 1200mAh 锂电池 (续航约 6-8 小时)"
    "powerSupply": string, // e.g. "Type-C 5V/1A 快速充电"
    "connectivity": string, // e.g. "Wi-Fi 802.11 b/g/n + BLE 5.0"
    "mcu": string, // e.g. "ESP32-S3 Dual-Core Xtensa LX7 @ 240MHz"
    "firmware": string // e.g. "CloudMaker FreeRTOS v1.2 / ESP-IDF 5.1"
  },
  "checks": [
    { "name": "模块引脚与总线冲突检测", "passed": true, "detail": "I2C/I2S总线分配无地址与引脚重叠" },
    { "name": "供电峰值与电池规格匹配", "passed": true, "detail": "系统最大瞬态功耗 1.8W，TP4056+1200mAh 充放电余量充足" },
    { "name": "外壳散热与干涉检查", "passed": true, "detail": "内部腔体间隙留量 > 1.2mm，发热芯片预留导热垫与气孔" }
  ],
  "wiring": [
    { "fromPin": "GPIO 4 (SDA)", "toComponent": "OLED显示屏", "toPin": "SDA", "signalType": "I2C", "note": "4.7k 上拉至 3.3V" },
    { "fromPin": "GPIO 5 (SCL)", "toComponent": "OLED显示屏", "toPin": "SCL", "signalType": "I2C", "note": "4.7k 上拉至 3.3V" },
    { "fromPin": "GPIO 15 (BCLK)", "toComponent": "MAX98357A 功放", "toPin": "BCLK", "signalType": "I2S", "note": "数字音频主时钟" },
    { "fromPin": "GPIO 16 (LRC)", "toComponent": "MAX98357A 功放", "toPin": "LRC", "signalType": "I2S", "note": "左右声道选择" },
    { "fromPin": "GPIO 17 (DIN)", "toComponent": "MAX98357A 功放", "toPin": "DIN", "signalType": "I2S", "note": "音频数据流" },
    { "fromPin": "GPIO 1/2", "toComponent": "MSM261S 硅麦", "toPin": "SD / SCK", "signalType": "I2S", "note": "麦克风采样输入" },
    { "fromPin": "VOUT (3.7V-4.2V)", "toComponent": "ME6211 LDO", "toPin": "VIN", "signalType": "Power", "note": "降压至 3.3V 稳压供给 MCU" }
  ],
  "mechParts": [
    { "name": "头部前壳 (含屏幕视窗)", "material": "高透光 PMMA + 黑色磨砂 ABS", "method": "SLA高精度光固化", "count": 1 },
    { "name": "头部后罩 (集成扬声器出音孔)", "material": "哑光白色 PLA/PETG", "method": "FDM 0.16mm 精细层厚", "count": 1 },
    { "name": "主底座托盘 (含电池仓与配重槽)", "material": "加韧 PLA", "method": "FDM 0.2mm 填充30%", "count": 1 },
    { "name": "左右微型双关节摆臂 (如适用)", "material": "树脂注塑 / SLA", "method": "9g舵机轴承卡扣", "count": 2 }
  ],
  "instructions": {
    "step1Flash": "esptool.py --chip esp32s3 --port COM3 write_flash 0x0 firmware_v1.2.bin",
    "flashGuide": "使用 Type-C 数据线按住 BOOT 键插入电脑 USB 端口，进入烧录模式执行上述脚本。",
    "assemblyGuide": "1. 将硅麦与摄像头排线接入主板；2. 安装扬声器并贴合密封海绵垫；3. 扣入 OLED 显示屏与底座锂电池；4. 拧紧 4 颗 M2*6 自攻螺丝。",
    "wifiConfig": "开机后设备发射热点 'CloudMaker-AP'，用手机连接并在浏览器打开 192.168.4.1 输入家庭 Wi-Fi 账号密码。",
    "cloudTesting": "设备配网成功后将自动通过 WebSocket 握手云端造物平台，屏幕显示欢快眨眼即代表联调成功！"
  },
  "diff": {
    "summary": string, // e.g. "V1.2 本次更新概览：紧凑化壳体设计，新增双摆臂舵机模块"
    "addedAbilities": [string], // e.g. ["+动作表达 (双关节摆臂)"]
    "addedModules": [string], // e.g. ["+SG90微型舵机x2"]
    "priceDelta": string // e.g. "￥128 → ￥146"
  }
}
`;

// Helper for local mock fallback when API key is not present or API call fails
function generateFallbackProject(prompt: string, currentProject?: any): any {
  const p = prompt.toLowerCase();
  const isIteration = Boolean(currentProject && currentProject.title);

  if (isIteration) {
    const prevVersion = currentProject.version || "V1.0";
    const nextVerNum = (parseFloat(prevVersion.replace("V", "")) + 0.1).toFixed(1);
    const newVersion = `V${nextVerNum}`;
    const addedServo = prompt.includes("手") || prompt.includes("臂") || prompt.includes("动");
    const addedCam = prompt.includes("看") || prompt.includes("摄像") || prompt.includes("视觉");
    const addedLed = prompt.includes("灯") || prompt.includes("光") || prompt.includes("环");

    const components = [...currentProject.components];
    const abilities = [...currentProject.abilities];
    const addedAbilities: string[] = [];
    const addedModules: string[] = [];
    let priceIncrease = 0;

    if (addedServo && !components.some((c: any) => c.name.includes("舵机"))) {
      components.push({
        id: `M0${components.length + 1}`,
        name: "微型摆臂舵机组",
        model: "SG90 9g 微型数字舵机 (金属齿轮)",
        quantity: 2,
        bus: "PWM (GPIO 8/9)",
        price: 18.0,
        function: "支持双臂动作交互与情绪挥手表达",
        highlightKey: "arm_left",
      });
      abilities.push({
        id: `ab_${Date.now()}_1`,
        title: "能做肢体动作表达 (双臂摆动)",
        desc: "根据对话语义挥手、打招呼或欢呼跳跃",
        implementation: "实现：双路 PWM 舵机驱控 + 柔性关节结构",
        icon: "hand",
      });
      addedAbilities.push("+肢体动作表达 (双臂摆动)");
      addedModules.push("+微型摆臂舵机组x2");
      priceIncrease += 18;
    }

    if (addedCam && !components.some((c: any) => c.name.includes("摄像头"))) {
      components.push({
        id: `M0${components.length + 1}`,
        name: "视觉摄像头",
        model: "OV2640 200万像素 DVP 广角镜头",
        quantity: 1,
        bus: "DVP / I2C",
        price: 18.0,
        function: "支持人脸追踪与环境目标识别",
        highlightKey: "camera",
      });
      abilities.push({
        id: `ab_${Date.now()}_2`,
        title: "能看到用户 (视觉人脸追踪)",
        desc: "实时检测视线范围内的人脸并调整朝向",
        implementation: "实现：广角摄像头模块 + 轻量级 YOLO 视觉引擎",
        icon: "eye",
      });
      addedAbilities.push("+视觉感知 (人脸追踪)");
      addedModules.push("+OV2640 广角摄像头");
      priceIncrease += 18;
    }

    if (addedLed && !components.some((c: any) => c.name.includes("灯"))) {
      components.push({
        id: `M0${components.length + 1}`,
        name: "RGB 氛围灯环",
        model: "WS2812B 8位超薄圆环",
        quantity: 1,
        bus: "Single-Wire GPIO",
        price: 8.0,
        function: "呼吸灯效与充电状态反馈",
        highlightKey: "head",
      });
      abilities.push({
        id: `ab_${Date.now()}_3`,
        title: "呼吸氛围灯效与光语互动",
        desc: "根据唤醒与情绪展示流水、呼吸与七彩渐变",
        implementation: "实现：WS2812B 可编程灯带总线控制",
        icon: "zap",
      });
      addedAbilities.push("+RGB 氛围灯效");
      addedModules.push("+WS2812B 灯环");
      priceIncrease += 8;
    }

    if (addedAbilities.length === 0) {
      addedAbilities.push("+结构紧凑度优化 (体积缩减 15%)");
      addedModules.push("更新机壳 3D 打印切片参数");
    }

    const prevPrice = currentProject.price || 128;
    const newPrice = prevPrice + priceIncrease;

    return {
      ...currentProject,
      version: newVersion,
      desc: `${currentProject.desc} (已响应指令：${prompt})`,
      price: newPrice,
      abilities,
      components,
      diff: {
        summary: `${newVersion} 本次更新概览：根据需求「${prompt.slice(0, 20)}...」更新了系统设计。`,
        addedAbilities,
        addedModules,
        priceDelta: `￥${prevPrice} → ￥${newPrice}`,
      },
    };
  }

  // New Generation based on keywords
  if (p.includes("植物") || p.includes("花") || p.includes("草") || p.includes("土壤")) {
    return {
      title: "智能植物监测仪",
      desc: "放在花盆里的超低功耗土壤湿度、日光与温湿度综合监测硬件产品",
      version: "V1.0",
      modelType: "plant_monitor",
      abilities: [
        {
          id: "ab_1",
          title: "精准感应土壤湿度与肥力",
          desc: "电容式防腐蚀土壤探针，持久监测根系水分",
          implementation: "实现：高频电容检测电路 (抗电解氧化)",
          icon: "activity",
        },
        {
          id: "ab_2",
          title: "全天候光照与温湿度监控",
          desc: "记录花草一整天接受的光合有效辐射(PAR)与空气温湿度",
          implementation: "实现：SHT30 高精度数字温湿度 + BH1750 光照传感器",
          icon: "thermometer",
        },
        {
          id: "ab_3",
          title: "超低功耗蓝牙与太阳能补能",
          desc: "单次充电续航达 180 天，支持太阳能滴灌联动",
          implementation: "实现：BLE 5.0 广播 + 超低功耗 DeepSleep 策略",
          icon: "zap",
        },
      ],
      components: [
        {
          id: "M01",
          name: "超低功耗主控板",
          model: "ESP32-C3-WROOM (RISC-V 160MHz)",
          quantity: 1,
          bus: "System",
          price: 14.0,
          function: "低功耗休眠唤醒、定时采集与BLE广播",
          highlightKey: "base",
        },
        {
          id: "M02",
          name: "防腐电容式土壤传感器",
          model: "V1.2 模拟电容探头 (沉金工艺)",
          quantity: 1,
          bus: "ADC (GPIO 2)",
          price: 9.0,
          function: "插入土壤测量容抗变化推算含水率",
          highlightKey: "sensor",
        },
        {
          id: "M03",
          name: "数字温湿度传感器",
          model: "SHT30-DIS (高精度 ±2% RH)",
          quantity: 1,
          bus: "I2C (0x44)",
          price: 11.0,
          function: "监测花草周围空气温湿度",
          highlightKey: "sensor",
        },
        {
          id: "M04",
          name: "环境光照度传感器",
          model: "BH1750FVI 16位高精度光强芯片",
          quantity: 1,
          bus: "I2C (0x23)",
          price: 8.0,
          function: "测量采光量评估光照时长",
          highlightKey: "head",
        },
        {
          id: "M05",
          name: "超薄锂电池与保护板",
          model: "500mAh 聚合物锂电 (带过放保护)",
          quantity: 1,
          bus: "Power 3.7V",
          price: 12.0,
          function: "轻薄嵌入壳体，待机半年",
          highlightKey: "battery",
        },
        {
          id: "M06",
          name: "防水防尘探针外壳",
          model: "IP65 密封环保 ABS 注塑壳",
          quantity: 1,
          bus: "Mechanical",
          price: 14.0,
          function: "防日晒、防浇水浸溅",
          highlightKey: "base",
        },
      ],
      specs: {
        dimensions: "168 x 38 x 22 mm",
        weight: "68g",
        battery: "3.7V 500mAh (休眠功耗仅 15μA，续航 > 180 天)",
        powerSupply: "Type-C 磁吸充电或微型太阳能板",
        connectivity: "BLE 5.0 Mesh + 微信小程序直连",
        mcu: "ESP32-C3 RISC-V 32位单核",
        firmware: "CloudMaker Ultra-LowPower OS v1.0",
      },
      checks: [
        { name: "探针防电解腐蚀设计", passed: true, detail: "采用交流方波激励与沉金绝缘层，彻底消除直流电蚀" },
        { name: "深度睡眠电流评估", passed: true, detail: "休眠功耗 14.2μA，符合室外超长待机预期" },
        { name: "外壳接缝防水性", passed: true, detail: "硅胶密封圈 + 倒扣结构满足 IP65 防泼溅标准" },
      ],
      wiring: [
        { fromPin: "GPIO 4 (SDA)", toComponent: "SHT30 & BH1750", toPin: "SDA", signalType: "I2C", note: "共用 I2C 总线" },
        { fromPin: "GPIO 5 (SCL)", toComponent: "SHT30 & BH1750", toPin: "SCL", signalType: "I2C", note: "共用 I2C 总线" },
        { fromPin: "GPIO 2 (ADC1_CH2)", toComponent: "土壤探头", toPin: "AOUT", signalType: "Analog", note: "12-bit ADC 模数转换" },
        { fromPin: "GPIO 3", toComponent: "电源使能管脚", toPin: "EN", signalType: "GPIO", note: "每次采样后切断传感器供电省电" },
      ],
      mechParts: [
        { name: "顶盖透光水滴造型窗", material: "透明 PC", method: "高光打磨注塑", count: 1 },
        { name: "上壳电子仓本体", material: "哑光白抗UV ABS", method: "SLA / FDM 0.16mm", count: 1 },
        { name: "下段插土叶片探针座", material: "加厚玻纤 PCB + 防水胶灌封", method: "沉金FR4", count: 1 },
      ],
      instructions: {
        step1Flash: "esptool.py --chip esp32c3 --port COM3 write_flash 0x0 plant_monitor_v1.0.bin",
        flashGuide: "将Type-C数据线连入监测仪底部隐藏口，一键烧录出厂固件。",
        assemblyGuide: "1. 焊好土壤探针引脚；2. 涂抹硅胶防水圈；3. 紧固上下壳卡扣。",
        wifiConfig: "手机开启蓝牙靠近花盆，微信小程序直接搜索 'PlantMonitor-01' 即可绑定花草品种。",
        cloudTesting: "轻触探针尖端并沾水，小程序折线图实时呈现湿度跃升即通过出厂质检。",
      },
      diff: {
        summary: "初始方案生成完毕：绿色农业 IoT 专属低功耗传感器节点。",
        addedAbilities: ["土壤湿度检测", "光照温湿度监测", "超长半年待机"],
        addedModules: ["ESP32-C3", "SHT30", "BH1750", "电容探头"],
        priceDelta: "预估总单价 ¥68.00",
      },
    };
  }

  if (p.includes("音箱") || p.includes("音乐") || p.includes("播放器") || p.includes("氛围")) {
    return {
      title: "桌面 AI 氛围音箱",
      desc: "能根据音乐律动、天气变化与用户情绪自适应声光互动的桌面立体声小音箱",
      version: "V1.0",
      modelType: "speaker",
      abilities: [
        {
          id: "ab_1",
          title: "情绪自适应声光律动",
          desc: "内置 360° 环绕幻彩导光柱，伴随节拍波形与人声呼吸起伏",
          implementation: "实现：FFT 音频频谱分析 + 24位环形 ARGB 灯带",
          icon: "zap",
        },
        {
          id: "ab_2",
          title: "无损高保真立体声输出",
          desc: "双被动低音辐射盘 + 5W 全频铷铁硼内磁扬声器",
          implementation: "实现：I2S 高保真 DAC 功放 (PCM5102 / MAX98357A)",
          icon: "volume-2",
        },
        {
          id: "ab_3",
          title: "AI 音乐伴侣与语音点歌",
          desc: "接入大模型音乐理解引擎，支持氛围电台与自然对话",
          implementation: "实现：远场消噪硅麦 + 离线语音唤醒词模型",
          icon: "mic",
        },
      ],
      components: [
        {
          id: "M01",
          name: "主控模组",
          model: "ESP32-S3-WROOM-1 (双核240MHz/16MB Flash)",
          quantity: 1,
          bus: "System",
          price: 28.0,
          function: "Wi-Fi串流、DSP音频解码与RGB驱动",
          highlightKey: "base",
        },
        {
          id: "M02",
          name: "数字音频功放芯片",
          model: "MAX98357A I2S Class-D 放大器",
          quantity: 1,
          bus: "I2S",
          price: 12.0,
          function: "驱动全频扬声器单元无损放大",
          highlightKey: "speaker",
        },
        {
          id: "M03",
          name: "全频内磁扬声器",
          model: "4Ω 5W 40mm 铷磁全频单元 + 被动盆",
          quantity: 1,
          bus: "Analog Audio",
          price: 16.0,
          function: "澎湃重低音与通透人声表现",
          highlightKey: "speaker",
        },
        {
          id: "M04",
          name: "全彩氛围导光环",
          model: "WS2812B 16颗环形 LED 阵列",
          quantity: 1,
          bus: "Single-Wire PWM",
          price: 10.0,
          function: "360度情绪律动色彩表达",
          highlightKey: "head",
        },
        {
          id: "M05",
          name: "硅麦阵列模组",
          model: "INMP441 全向全频拾音麦",
          quantity: 2,
          bus: "I2S",
          price: 14.0,
          function: "远场拾音与降噪回声消除",
          highlightKey: "base",
        },
        {
          id: "M06",
          name: "电源管理与电池",
          model: "2000mAh 18650 锂电池 + TP4056 充放保护",
          quantity: 1,
          bus: "Power 3.7V",
          price: 18.0,
          function: "长达 10 小时连续音乐播放",
          highlightKey: "battery",
        },
      ],
      specs: {
        dimensions: "90 x 90 x 115 mm",
        weight: "260g",
        battery: "3.7V 2000mAh (连续播放 8-10 小时)",
        powerSupply: "Type-C 5V/2A 快速补能",
        connectivity: "Wi-Fi AirPlay/DLNA + Bluetooth 5.0 双模",
        mcu: "ESP32-S3 Dual-Core Xtensa LX7",
        firmware: "CloudMaker AudioOS v1.0",
      },
      checks: [
        { name: "音频腔体密闭性气密检测", passed: true, detail: "独立 180cc 声学密封后腔，杜绝声短路与杂音" },
        { name: "喇叭大动态峰值功率储备", passed: true, detail: "功放支持 5V/3.2W 输出，电源回路加装 470μF 储能电容" },
        { name: "麦克风与喇叭声学隔震", passed: true, detail: "硅麦周边装配软质硅胶套，降低腔体共振干扰" },
      ],
      wiring: [
        { fromPin: "GPIO 15 (BCLK)", toComponent: "MAX98357A", toPin: "BCLK", signalType: "I2S", note: "位时钟" },
        { fromPin: "GPIO 16 (LRC)", toComponent: "MAX98357A", toPin: "LRC", signalType: "I2S", note: "帧时钟" },
        { fromPin: "GPIO 17 (DIN)", toComponent: "MAX98357A", toPin: "DIN", signalType: "I2S", note: "音频数据" },
        { fromPin: "GPIO 4", toComponent: "WS2812B 灯环", toPin: "DIN", signalType: "PWM", note: "RGB 灯效控制" },
      ],
      mechParts: [
        { name: "上层乳白磨砂导光圆筒", material: "漫反射 PC", method: "注塑 / SLA 抛光", count: 1 },
        { name: "中置声学共鸣腔室", material: "加厚 ABS (防震)", method: "FDM 100% 填充壁厚2.4mm", count: 1 },
        { name: "金属网罩底座与防滑硅胶垫", material: "铝合金阳极氧化网孔 + 硅胶", method: "冲压网孔", count: 1 },
      ],
      instructions: {
        step1Flash: "esptool.py --chip esp32s3 --port COM3 write_flash 0x0 ai_speaker_v1.0.bin",
        flashGuide: "插入背部隐藏调试口，运行脚本将 DSP 调音固件注入。",
        assemblyGuide: "1. 喇叭装入前腔并打密封胶；2. 固定功放板与ESP32主板；3. 扣入导光柱并拧紧底盖螺丝。",
        wifiConfig: "长按顶部圆形凹陷按键3秒进入配网模式，手机连接音箱热点并配网。",
        cloudTesting: "对着音箱说 '造物同学，播放轻音乐'，听到清脆提示音与灯光变绿即成功上线！",
      },
      diff: {
        summary: "初始方案生成完毕：高品质桌面声光一体化 AI 伴侣音箱。",
        addedAbilities: ["情绪声光律动", "无损高保真功放", "远场语音唤醒"],
        addedModules: ["ESP32-S3", "MAX98357A", "40mm喇叭", "WS2812B灯环"],
        priceDelta: "预估总单价 ¥98.00",
      },
    };
  }

  // Default: Companion Robot
  return {
    title: prompt ? `${prompt.slice(0, 10)} 硬件原型` : "桌面陪伴机器人",
    desc: prompt || "支持语音交互、表情显示和基础视觉感知的桌面 AI 产品",
    version: "V1.2",
    modelType: "robot",
    abilities: [
      {
        id: "ab_1",
        title: "能听到用户说话",
        desc: "精准识别人声唤醒与连续拾音，过滤桌面敲击键盘杂音",
        implementation: "实现：双麦克风阵列 + 降噪引擎",
        icon: "mic",
      },
      {
        id: "ab_2",
        title: "能进行 AI 语音对话",
        desc: "毫秒级流式响应，像真人好友一样倾听陪伴与解答疑惑",
        implementation: "实现：大模型语音交互服务",
        icon: "message-square",
      },
      {
        id: "ab_3",
        title: "能看到用户 (视觉感知)",
        desc: "自动识别人脸位置并注视互动，支持简单手势辨识",
        implementation: "实现：广角摄像头模块 (V1.2新增)",
        icon: "eye",
      },
      {
        id: "ab_4",
        title: "能显示情绪与表情",
        desc: "灵动的眨眼、开心、困倦等几何像素表情动画",
        implementation: "实现：1.3\" OLED 显示屏 (V1.2新增)",
        icon: "smile",
      },
    ],
    components: [
      {
        id: "M01",
        name: "主控核心板",
        model: "ESP32-S3-WROOM-1 (16MB)",
        quantity: 1,
        bus: "System",
        price: 28.0,
        function: "主控微处理器、Wi-Fi/BLE 通讯及外设驱动",
        highlightKey: "base",
      },
      {
        id: "M02",
        name: "视觉摄像头",
        model: "OV2640 200万像素 DVP",
        quantity: 1,
        bus: "DVP / I2C",
        price: 18.0,
        function: "人脸追踪及手势识别图像捕获",
        highlightKey: "camera",
      },
      {
        id: "M03",
        name: "显示屏",
        model: "1.3\" OLED 128x64",
        quantity: 1,
        bus: "I2C (0x3C)",
        price: 12.0,
        function: "机器人眼睛与面部微表情绘制",
        highlightKey: "screen",
      },
      {
        id: "M04",
        name: "麦克风阵列",
        model: "MSM261S4030H0 I2S 硅麦",
        quantity: 2,
        bus: "I2S",
        price: 14.0,
        function: "左右声道差分降噪波束成形拾音",
        highlightKey: "head",
      },
      {
        id: "M05",
        name: "音频功放与喇叭",
        model: "MAX98357A + 2W 腔体喇叭",
        quantity: 1,
        bus: "I2S",
        price: 16.0,
        function: "数字音频解码并驱动清亮人声扬声器",
        highlightKey: "speaker",
      },
      {
        id: "M06",
        name: "电源管理与电池",
        model: "TP4056 + 1200mAh 锂电池",
        quantity: 1,
        bus: "Power 3.7V",
        price: 22.0,
        function: "便携供电与过充过放欠压保护",
        highlightKey: "battery",
      },
      {
        id: "M07",
        name: "外壳结构件",
        model: "PLA 3D打印机壳套件",
        quantity: 1,
        bus: "Mechanical",
        price: 18.0,
        function: "圆润机身外壳与内部卡扣固定支架",
        highlightKey: "head",
      },
    ],
    specs: {
      dimensions: "85 x 78 x 96 mm",
      weight: "185g",
      battery: "3.7V 1200mAh (待机约 14 小时，连续对话 4.5 小时)",
      powerSupply: "Type-C 5V/1A 输入",
      connectivity: "Wi-Fi 2.4GHz 802.11 b/g/n + BLE 5.0",
      mcu: "ESP32-S3 Dual-Core Xtensa LX7 @ 240MHz",
      firmware: "CloudMaker RobotOS v1.2 (基于 FreeRTOS)",
    },
    checks: [
      { name: "模块引脚与总线冲突检测", passed: true, detail: "I2C/I2S总线分配无冲突，无引脚复用争用" },
      { name: "供电峰值与电池规格匹配", passed: true, detail: "最大瞬态功耗 1.8W，符合电池放电倍率 (3.7V/1200mAh)" },
      { name: "外壳腔体紧凑度与干涉", passed: true, detail: "各模组结构配合公差 ≥ 0.25mm，预留装配引导槽" },
    ],
    wiring: [
      { fromPin: "GPIO 4 (SDA)", toComponent: "OLED显示屏", toPin: "SDA", signalType: "I2C", note: "4.7k 上拉电阻" },
      { fromPin: "GPIO 5 (SCL)", toComponent: "OLED显示屏", toPin: "SCL", signalType: "I2C", note: "4.7k 上拉电阻" },
      { fromPin: "GPIO 15 (BCLK)", toComponent: "MAX98357A 功放", toPin: "BCLK", signalType: "I2S", note: "I2S Bit Clock" },
      { fromPin: "GPIO 16 (LRC)", toComponent: "MAX98357A 功放", toPin: "LRC", signalType: "I2S", note: "Word Select" },
      { fromPin: "GPIO 17 (DIN)", toComponent: "MAX98357A 功放", toPin: "DIN", signalType: "I2S", note: "Serial Data In" },
      { fromPin: "GPIO 1/2", toComponent: "MSM261S 硅麦", toPin: "SD / SCK", signalType: "I2S", note: "全向硅麦差分输入" },
      { fromPin: "VBAT (3.7V)", toComponent: "ME6211C33 LDO", toPin: "VIN", signalType: "Power", note: "低压差稳压 3.3V 500mA" },
    ],
    mechParts: [
      { name: "头部外罩 (圆角方形带开窗)", material: "乳白 PLA / 光敏树脂", method: "FDM 0.16mm / SLA", count: 1 },
      { name: "高透光屏幕保护镜片", material: "亚克力板 (防刮花)", method: "激光切割 1.5mm", count: 1 },
      { name: "下盘底座 (含配重仓与脚垫槽)", material: "哑光灰 PLA", method: "FDM 0.2mm 填充25%", count: 1 },
      { name: "摄像头固定夹持卡扣", material: "加韧树脂", method: "SLA 高精度", count: 1 },
    ],
    instructions: {
      step1Flash: "esptool.py --chip esp32s3 --port COM3 write_flash 0x0 firmware_v1.2.bin",
      flashGuide: "使用 Type-C 数据线连接主控板 M01，按住BOOT键后松开EN键即可开始刷机。",
      assemblyGuide: "1. 将硅麦与摄像头排线依次卡入座子；2. 扬声器贴合密封海绵垫；3. 扣合上下壳并打入自攻螺丝。",
      wifiConfig: "设备首次通电发射 'CloudMaker-AP' 配网热点，浏览器输入 192.168.4.1 输入 Wi-Fi 凭证即可。",
      cloudTesting: "设备联网后，屏幕眨眼并发出 '嘀' 声提示，云端造物后台显示设备在线即完成！",
    },
    diff: {
      summary: "V1.2 本次更新概览：新增能力 +视觉感知, +表情显示；新增模块 +摄像头, +显示屏；成本变化: ￥90 → ￥128",
      addedAbilities: ["+视觉感知 (广角摄像头)", "+表情显示 (1.3寸OLED)"],
      addedModules: ["+OV2640 摄像头", "+1.3寸 OLED 显示屏"],
      priceDelta: "￥90 → ￥128",
    },
  };
}

// API endpoint to generate hardware project from natural language prompt
app.post("/api/generate-hardware", async (req: Request, res: Response) => {
  try {
    const { prompt, currentProject, action } = req.body;
    if (!prompt || typeof prompt !== "string") {
      res.status(400).json({ error: "Prompt is required" });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Return enhanced rule-based synthesis when API key is not configured
      const fallback = generateFallbackProject(prompt, currentProject);
      res.json({ project: fallback, source: "fallback_engine" });
      return;
    }

    // Call Gemini 3.8 Flash
    const userMessage = action === "iterate" && currentProject
      ? `Current Hardware Project state:
${JSON.stringify(currentProject, null, 2)}

User's requested modification or iteration:
"${prompt}"

Please evolve the hardware project accordingly, update version, capabilities, components, wiring, price, and diff.`
      : `User's idea for a new hardware product:
"${prompt}"

Design the complete hardware project from scratch conforming to the schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [
        { role: "user", parts: [{ text: `${SYSTEM_PROMPT}\n\n${userMessage}` }] },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "";
    try {
      const parsed = JSON.parse(text);
      res.json({ project: parsed, source: "gemini_api" });
    } catch {
      // If parsing fails, fall back gracefully
      const fallback = generateFallbackProject(prompt, currentProject);
      res.json({ project: fallback, source: "fallback_engine" });
    }
  } catch (error: any) {
    console.error("Gemini hardware generation error:", error);
    // Fall back smoothly so user experience never breaks
    const fallback = generateFallbackProject(req.body.prompt || "", req.body.currentProject);
    res.json({ project: fallback, source: "fallback_engine" });
  }
});

// API health endpoint
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", service: "cloud-maker-backend", timestamp: new Date().toISOString() });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CloudMaker server running at http://localhost:${PORT}`);
  });
}

startServer();

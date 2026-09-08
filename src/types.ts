export interface Ability {
  id: string;
  title: string;
  desc: string;
  implementation: string;
  icon: string;
}

export interface HardwareComponent {
  id: string;
  name: string;
  model: string;
  quantity: number;
  bus: string;
  price: number;
  function: string;
  highlightKey?: string;
}

export interface EngineeringCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface WiringConnection {
  fromPin: string;
  toComponent: string;
  toPin: string;
  signalType: "I2C" | "I2S" | "SPI" | "UART" | "PWM" | "Analog" | "Power" | "GPIO";
  note: string;
}

export interface MechPart {
  name: string;
  material: string;
  method: string;
  count: number;
}

export interface Instructions {
  step1Flash: string;
  flashGuide: string;
  assemblyGuide: string;
  wifiConfig: string;
  cloudTesting: string;
}

export interface ProjectDiff {
  summary: string;
  addedAbilities: string[];
  addedModules: string[];
  priceDelta: string;
}

export interface ProjectSpecs {
  dimensions: string;
  weight: string;
  battery: string;
  powerSupply: string;
  connectivity: string;
  mcu: string;
  firmware: string;
}

export interface HardwareProject {
  title: string;
  desc: string;
  version: string;
  modelType: "robot" | "plant_monitor" | "speaker" | "custom_device" | "wearable";
  abilities: Ability[];
  components: HardwareComponent[];
  specs: ProjectSpecs;
  checks: EngineeringCheck[];
  wiring: WiringConnection[];
  mechParts: MechPart[];
  instructions: Instructions;
  diff: ProjectDiff;
}

export type PageId = "page-landing" | "page-workbench" | "page-engineering";
export type TabKey = "info" | "bom" | "wiring" | "mech" | "instructions";
export type ViewportMode = "appearance" | "exploded" | "demo";

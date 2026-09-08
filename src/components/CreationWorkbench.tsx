import React, { useState } from "react";
import {
  Zap,
  Cpu,
  Tag,
  CheckCircle,
  CheckCircle2,
  Info,
  Mic,
  MessageSquare,
  Eye,
  Smile,
  Hand,
  Volume2,
  Thermometer,
  Activity,
  Send,
  Loader2,
  ShieldCheck,
  Check,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { HardwareProject, ViewportMode } from "../types";
import { ThreeViewport } from "./ThreeViewport";

interface CreationWorkbenchProps {
  project: HardwareProject;
  onConfirmPlan: () => void;
  onIterateProject: (prompt: string) => Promise<void>;
  isIterating: boolean;
  onSelectHighlightKey: (key?: string) => void;
  highlightedKey?: string;
}

export const CreationWorkbench: React.FC<CreationWorkbenchProps> = ({
  project,
  onConfirmPlan,
  onIterateProject,
  isIterating,
  onSelectHighlightKey,
  highlightedKey,
}) => {
  const [viewportMode, setViewportMode] = useState<ViewportMode>("appearance");
  const [iteratePrompt, setIteratePrompt] = useState(
    "整体再紧凑一点，另外机器人希望增加两只手做动作表达"
  );

  const totalPrice = project.components.reduce((acc, c) => acc + c.price * c.quantity, 0);

  const getAbilityIcon = (iconName: string) => {
    switch (iconName) {
      case "mic":
        return <Mic className="w-4 h-4 text-blue-600" />;
      case "message-square":
        return <MessageSquare className="w-4 h-4 text-indigo-600" />;
      case "eye":
        return <Eye className="w-4 h-4 text-emerald-600" />;
      case "smile":
        return <Smile className="w-4 h-4 text-amber-500" />;
      case "hand":
        return <Hand className="w-4 h-4 text-purple-600" />;
      case "volume-2":
        return <Volume2 className="w-4 h-4 text-indigo-600" />;
      case "thermometer":
        return <Thermometer className="w-4 h-4 text-rose-500" />;
      case "activity":
        return <Activity className="w-4 h-4 text-emerald-600" />;
      default:
        return <Zap className="w-4 h-4 text-amber-500" />;
    }
  };

  const handleIterateSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!iteratePrompt.trim() || isIterating) return;
    await onIterateProject(iteratePrompt.trim());
  };

  return (
    <section
      id="page-workbench"
      className="flex-1 flex flex-col bg-[#f8fafc] min-h-[calc(100vh-60px)]"
    >
      {/* SUB HEADER BAR */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center space-x-3 flex-wrap">
          <span className="font-bold text-slate-800 text-base" id="wb-title">
            {project.title}
          </span>
          <span
            id="wb-version-badge"
            className="bg-indigo-50 text-indigo-600 text-xs px-2 py-0.5 rounded font-semibold border border-indigo-100"
          >
            {project.version}
          </span>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <span className="text-xs text-slate-500 line-clamp-1 max-w-md">
            {project.desc}
          </span>
        </div>

        <div className="flex items-center space-x-4 flex-wrap">
          <div className="flex items-center space-x-3 text-xs font-medium">
            <span className="flex items-center text-slate-600">
              <Zap className="w-3.5 h-3.5 text-amber-500 mr-1" />
              <span id="wb-ability-count" className="font-bold text-slate-800 mr-0.5">
                {project.abilities.length}
              </span>
              项能力
            </span>
            <span className="flex items-center text-slate-600">
              <Cpu className="w-3.5 h-3.5 text-indigo-500 mr-1" />
              <span id="wb-module-count" className="font-bold text-slate-800 mr-0.5">
                {project.components.length}
              </span>
              个核心模块
            </span>
            <span className="flex items-center text-slate-600">
              <Tag className="w-3.5 h-3.5 text-emerald-500 mr-1" />
              预计{" "}
              <b className="text-indigo-600 ml-1 text-sm font-bold" id="wb-price">
                ￥{totalPrice.toFixed(0)}
              </b>
            </span>
            <span className="hidden lg:flex items-center text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
              <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              基础工程检查：正常
            </span>
          </div>

          <button
            id="btn-confirm-plan"
            onClick={onConfirmPlan}
            className="bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white text-xs font-semibold px-4 py-2 rounded-lg transition flex items-center shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            <span>确认方案 (进入工程设计)</span>
          </button>
        </div>
      </div>

      {/* MAIN WORKSPACE GRID */}
      <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-12 gap-4 max-w-[1600px] mx-auto w-full">
        {/* LEFT COLUMN: ABILITIES (col-span-3) */}
        <div className="md:col-span-3 space-y-3 flex flex-col justify-start">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-1.5">
              <span>当前产品能力</span>
              <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">
                {project.abilities.length}
              </span>
            </h3>
            <span
              title="这些能力根据您的自然语言需求自动推导与适配硬件模组"
              className="cursor-help"
            >
              <Info className="w-3.5 h-3.5 text-slate-400" />
            </span>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[560px] pr-1">
            {project.abilities.map((ability) => (
              <div
                key={ability.id}
                className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-500/5 transition group"
              >
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-slate-50 group-hover:bg-indigo-50/50 rounded-lg transition shrink-0">
                    {getAbilityIcon(ability.icon)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-slate-800 group-hover:text-indigo-600 transition">
                      {ability.title}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {ability.desc}
                    </div>
                    <div className="text-[10px] text-indigo-600/80 font-medium mt-1 bg-indigo-50/60 px-1.5 py-0.5 rounded inline-block">
                      {ability.implementation}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER COLUMN: 3D VIEWPORT (col-span-6) */}
        <div className="md:col-span-6 bg-gradient-to-b from-slate-100 to-indigo-50/30 rounded-2xl border border-slate-200/60 p-2 flex flex-col justify-between items-center relative overflow-hidden min-h-[460px] shadow-inner">
          <ThreeViewport
            modelType={project.modelType}
            mode={viewportMode}
            onModeChange={setViewportMode}
            highlightedKey={highlightedKey}
            onSelectKey={onSelectHighlightKey}
          />
        </div>

        {/* RIGHT COLUMN: OVERVIEW & CHECKS (col-span-3) */}
        <div className="md:col-span-3 space-y-4 flex flex-col justify-between">
          {/* HARDWARE OVERVIEW TABLE */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800 text-sm">核心组成概览</h3>
              <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded font-mono">
                预计 ￥{totalPrice.toFixed(0)}
              </span>
            </div>

            <div className="text-xs space-y-2 overflow-y-auto flex-1 max-h-[300px] pr-1">
              {project.components.slice(0, 6).map((comp) => {
                const isHighlighted = highlightedKey && comp.highlightKey === highlightedKey;
                return (
                  <div
                    key={comp.id}
                    onClick={() => onSelectHighlightKey(isHighlighted ? undefined : comp.highlightKey)}
                    className={`flex items-center justify-between py-1.5 px-2 rounded-lg border transition cursor-pointer ${
                      isHighlighted
                        ? "bg-indigo-50 border-indigo-200 text-indigo-900"
                        : "border-transparent hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span className="text-[10px] font-mono text-slate-400 font-semibold">
                        {comp.id}
                      </span>
                      <span className="truncate font-medium">{comp.name}</span>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-slate-500 font-mono text-[11px] truncate max-w-[90px]">
                        {comp.model.split(" ")[0]}
                      </span>
                      <span className="font-mono text-indigo-600 font-semibold">
                        ¥{comp.price}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              id="btn-view-all-modules"
              onClick={onConfirmPlan}
              className="w-full mt-4 py-2 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-indigo-600 font-semibold text-xs rounded-lg transition border border-slate-200 cursor-pointer"
            >
              查看完整模组关联与 BOM (共{project.components.length}项)
            </button>
          </div>

          {/* CHECKLIST CARD */}
          <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100">
            <div className="flex items-center text-emerald-800 font-bold text-xs mb-2.5">
              <ShieldCheck className="w-4 h-4 mr-1 text-emerald-600" />
              <span>基础工程检查</span>
              <span className="ml-auto bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-semibold">
                ALL PASS
              </span>
            </div>
            <ul className="text-[11px] text-emerald-700 space-y-1.5">
              {project.checks.map((chk, idx) => (
                <li key={idx} className="flex items-start">
                  <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="leading-snug">{chk.detail || chk.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* BOTTOM AI CHAT & ITERATION BAR */}
      <div className="bg-white border-t border-slate-200 p-4 sticky bottom-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto space-y-3">
          {/* Update status summary */}
          <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <div className="flex items-center space-x-2 flex-wrap">
              <span className="font-bold text-emerald-700 flex items-center">
                <Info className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                {project.diff?.summary || `${project.version} 当前版本设计已就绪`}
              </span>
            </div>
            <div className="font-medium text-slate-700 flex items-center space-x-2">
              <span>成本预估:</span>
              <span className="text-emerald-600 font-bold font-mono">
                {project.diff?.priceDelta || `¥${totalPrice.toFixed(0)}`}
              </span>
            </div>
          </div>

          {/* Prompt bar */}
          <form
            onSubmit={handleIterateSubmit}
            className="flex items-center space-x-3"
          >
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 flex items-center space-x-2 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition">
              <MessageSquare className="w-4 h-4 text-indigo-500 shrink-0" />
              <input
                type="text"
                id="wb-prompt-input"
                value={iteratePrompt}
                onChange={(e) => setIteratePrompt(e.target.value)}
                placeholder="在此输入新的需求或调整，例如：整体再紧凑一点，另外希望增加舵机双臂..."
                className="w-full bg-transparent outline-none text-xs text-slate-700 placeholder-slate-400"
              />
            </div>

            <button
              id="btn-ai-regenerate"
              type="submit"
              disabled={isIterating || !iteratePrompt.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition flex items-center space-x-1.5 shadow-md shadow-indigo-600/20 shrink-0 disabled:opacity-75 cursor-pointer"
            >
              {isIterating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>AI 重新生成中...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>AI 重新生成</span>
                </>
              )}
            </button>
          </form>

          {/* Quick iteration shortcut tags */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px] text-slate-400">
            <span>快捷调优推荐:</span>
            <button
              type="button"
              onClick={() => {
                setIteratePrompt("整体再紧凑一点，另外机器人希望增加两只手做动作表达");
              }}
              className="hover:text-indigo-600 hover:underline transition"
            >
              +增加机械双臂
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => {
                setIteratePrompt("增加 RGB 氛围环形灯带，提供流水与呼吸灯效果");
              }}
              className="hover:text-indigo-600 hover:underline transition"
            >
              +WS2812B氛围灯环
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => {
                setIteratePrompt("更换为大容量2000mAh电池，优化低功耗待机策略");
              }}
              className="hover:text-indigo-600 hover:underline transition"
            >
              +升级续航电池
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => {
                setIteratePrompt("增加环境温湿度与空气质量监测传感器");
              }}
              className="hover:text-indigo-600 hover:underline transition"
            >
              +温湿度监测
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

import React, { useState } from "react";
import { Sparkles, Bot, Sprout, Speaker, ArrowRight, Lightbulb, Zap, CheckCircle2, Cpu, Wrench } from "lucide-react";
import { HardwareProject } from "../types";
import { DEFAULT_ROBOT_PROJECT, DEFAULT_PLANT_PROJECT, DEFAULT_SPEAKER_PROJECT } from "../data/defaults";

interface LandingPageProps {
  onStartBuild: (presetOrPrompt: string | HardwareProject) => void;
  isLoading?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartBuild, isLoading = false }) => {
  const [prompt, setPrompt] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const trimmed = prompt.trim();
    if (trimmed) {
      onStartBuild(trimmed);
    } else {
      onStartBuild(DEFAULT_ROBOT_PROJECT);
    }
  };

  return (
    <section
      id="page-landing"
      className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 flex flex-col justify-between"
    >
      {/* HERO AREA */}
      <div className="text-center mt-6 mb-10">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4 leading-tight">
          让每一次灵感都有迹可循
        </h1>
        <p className="text-slate-500 text-base md:text-lg max-w-2xl mx-auto">
          从一句话开始，让想法变成好看、可改、可落地的硬件产品。
        </p>

        {/* INPUT BOX */}
        <div className="max-w-3xl mx-auto mt-8 relative">
          <div className="relative flex items-center bg-white rounded-2xl shadow-xl shadow-indigo-100/50 border border-slate-200/80 p-2 pl-5 transition-all focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent">
            <Sparkles className="w-5 h-5 text-indigo-500 mr-3 shrink-0" />
            <input
              type="text"
              id="prompt-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="描述你想做的产品，设备或创意......"
              className="w-full bg-transparent outline-none text-slate-700 placeholder-slate-400 text-base py-1"
            />
            <button
              id="btn-start-build"
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-medium px-7 py-3 rounded-xl transition flex items-center space-x-2 shrink-0 shadow-lg shadow-indigo-600/20 disabled:opacity-75 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>AI 创成中...</span>
                </>
              ) : (
                <span>开始造物</span>
              )}
            </button>
          </div>

          {/* Quick chip suggestions */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-xs text-slate-500">
            <span className="text-slate-400">热点推荐:</span>
            <button
              onClick={() => setPrompt("带机械手腕与眼睛表情的迷你桌面桌搭助手")}
              className="hover:text-indigo-600 hover:underline transition"
            >
              #表情桌面机器人
            </button>
            <span className="text-slate-300">·</span>
            <button
              onClick={() => setPrompt("水培与花盆通用的低功耗土壤EC值光照监测棒")}
              className="hover:text-indigo-600 hover:underline transition"
            >
              #土壤光照监测仪
            </button>
            <span className="text-slate-300">·</span>
            <button
              onClick={() => setPrompt("能够识别人脸并带RGB声光动效的桌上拾音小音箱")}
              className="hover:text-indigo-600 hover:underline transition"
            >
              #声光律动音箱
            </button>
            <span className="text-slate-300">·</span>
            <button
              onClick={() => setPrompt("ESP32墨水屏天气股票时钟")}
              className="hover:text-indigo-600 hover:underline transition"
            >
              #低功耗墨水屏时钟
            </button>
          </div>
        </div>

        {/* EXAMPLES SECTION */}
        <div className="mt-8">
          <div className="flex items-center justify-center text-xs text-slate-400 space-x-1 mb-4">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>试试这些灵感示例（仅作参考，你也可以自由输入）</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {/* Card 1: 桌面陪伴机器人 */}
            <div
              id="example-card-robot"
              onClick={() => onStartBuild(DEFAULT_ROBOT_PROJECT)}
              className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition cursor-pointer text-left group flex flex-col justify-between relative overflow-hidden"
            >
              <div>
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition">
                  <Bot className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-slate-800">桌面陪伴机器人</h3>
                  <span className="text-[11px] font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    ¥128
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  我想做一个能陪我聊天、放在桌面上的小机器人。
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                  <span className="text-[10px] bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-100">
                    双麦降噪
                  </span>
                  <span className="text-[10px] bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-100">
                    广角镜头
                  </span>
                  <span className="text-[10px] bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-100">
                    OLED微表情
                  </span>
                </div>
              </div>
              <div className="mt-4 text-xs font-semibold text-indigo-600 flex items-center group-hover:translate-x-1 transition">
                <span>用这个想法开始</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </div>

            {/* Card 2: 智能植物监测仪 */}
            <div
              id="example-card-plant"
              onClick={() => onStartBuild(DEFAULT_PLANT_PROJECT)}
              className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/5 transition cursor-pointer text-left group flex flex-col justify-between relative overflow-hidden"
            >
              <div>
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition">
                  <Sprout className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-slate-800">智能植物监测仪</h3>
                  <span className="text-[11px] font-mono font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                    ¥68
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  帮我设计一个能在花盆里的低功耗土壤湿度日光监测器。
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                  <span className="text-[10px] bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-100">
                    电容探针
                  </span>
                  <span className="text-[10px] bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-100">
                    SHT30温湿
                  </span>
                  <span className="text-[10px] bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-100">
                    半年超长待机
                  </span>
                </div>
              </div>
              <div className="mt-4 text-xs font-semibold text-emerald-600 flex items-center group-hover:translate-x-1 transition">
                <span>用这个想法开始</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </div>

            {/* Card 3: 桌面 AI 氛围音箱 */}
            <div
              id="example-card-speaker"
              onClick={() => onStartBuild(DEFAULT_SPEAKER_PROJECT)}
              className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/5 transition cursor-pointer text-left group flex flex-col justify-between relative overflow-hidden"
            >
              <div>
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition">
                  <Speaker className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-slate-800">桌面 AI 氛围音箱</h3>
                  <span className="text-[11px] font-mono font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                    ¥98
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  做一个能根据显示频情绪氛围与天气适配的桌面小音箱。
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                  <span className="text-[10px] bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-100">
                    RGB幻彩灯环
                  </span>
                  <span className="text-[10px] bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-100">
                    5W内磁喇叭
                  </span>
                  <span className="text-[10px] bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-100">
                    声光律动
                  </span>
                </div>
              </div>
              <div className="mt-4 text-xs font-semibold text-purple-600 flex items-center group-hover:translate-x-1 transition">
                <span>用这个想法开始</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STEPS FOOTER */}
      <div className="border-t border-slate-200/60 pt-8 pb-4">
        <h2 className="text-center font-bold text-slate-800 text-lg mb-6">
          从灵感到方案落地，只需四步
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-start space-x-3 shadow-xs">
            <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded">
              01
            </span>
            <div>
              <div className="font-bold text-sm text-slate-800">输入灵感</div>
              <div className="text-xs text-slate-400 mt-0.5">一句话描述你的硬件想法</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-start space-x-3 shadow-xs">
            <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded">
              02
            </span>
            <div>
              <div className="font-bold text-sm text-slate-800">生成 3D 模型</div>
              <div className="text-xs text-slate-400 mt-0.5">实时查看外观、爆炸图与动态展示</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-start space-x-3 shadow-xs">
            <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded">
              03
            </span>
            <div>
              <div className="font-bold text-sm text-slate-800">进入造物工作台</div>
              <div className="text-xs text-slate-400 mt-0.5">自然语言调整功能、结构与模块配置</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-start space-x-3 shadow-xs">
            <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded">
              04
            </span>
            <div>
              <div className="font-bold text-sm text-slate-800">输出工程结果</div>
              <div className="text-xs text-slate-400 mt-0.5">一键导出完整BOM、接线与固件工程包</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

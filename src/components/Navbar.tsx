import React from "react";
import { Box, User, ExternalLink, Sparkles, HelpCircle, Code, ShieldCheck } from "lucide-react";
import { PageId } from "../types";

interface NavbarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  projectTitle?: string;
  projectVersion?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  projectTitle,
  projectVersion,
}) => {
  return (
    <header
      id="main-nav-header"
      className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-3 flex items-center justify-between shadow-xs transition-colors"
    >
      {/* BRAND & LOGO */}
      <div
        id="nav-brand-btn"
        onClick={() => onNavigate("page-landing")}
        className="flex items-center space-x-3 cursor-pointer group"
      >
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
          <Box className="w-5 h-5" />
        </div>
        <div className="flex items-center space-x-2">
          <span
            id="nav-brand-title"
            className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-indigo-900"
          >
            云端造物
          </span>
          <span
            id="nav-brand-badge"
            className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium border border-indigo-100 flex items-center space-x-1"
          >
            <Sparkles className="w-2.5 h-2.5 mr-0.5 text-indigo-500" />
            <span>Design by Result</span>
          </span>
        </div>

        {/* Current Context Pill */}
        {currentPage !== "page-landing" && projectTitle && (
          <div className="hidden md:flex items-center space-x-2 pl-3 ml-2 border-l border-slate-200 text-xs">
            <span className="text-slate-400">正在设计:</span>
            <span className="font-semibold text-slate-700">{projectTitle}</span>
            {projectVersion && (
              <span className="bg-slate-100 text-slate-600 font-mono px-1.5 py-0.5 rounded text-[10px]">
                {projectVersion}
              </span>
            )}
          </div>
        )}
      </div>

      {/* NAVIGATION LINKS & STATUS */}
      <div className="flex items-center space-x-6 text-sm font-medium text-slate-600">
        <a
          href="#community"
          onClick={(e) => {
            e.preventDefault();
            alert("社区频道：与来自全球的上万名创客、硬件工程师交流创成式设计经验与固件源码！");
          }}
          className="hover:text-indigo-600 transition flex items-center space-x-1"
        >
          <span>社区</span>
        </a>
        <a
          href="#courses"
          onClick={(e) => {
            e.preventDefault();
            alert("创客实战课程：ESP32-S3 实战硬件速成、KiCad PCB 打样与立创商城自动化对接。");
          }}
          className="hover:text-indigo-600 transition"
        >
          <span>课程</span>
        </a>
        <a
          href="#vcloud"
          onClick={(e) => {
            e.preventDefault();
            alert("V Cloud 云端服务：提供大模型语音交互中继、MQTT 物联网透传与 OTA 远程升级节点。");
          }}
          className="hover:text-indigo-600 transition flex items-center space-x-1"
        >
          <span>V Cloud</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </a>

        {/* USER PROFILE */}
        <div
          title="创客工程师: hwq9800@gmail.com"
          className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-semibold text-xs cursor-pointer hover:border-indigo-400 transition"
        >
          <User className="w-4 h-4" />
        </div>
      </div>
    </header>
  );
};

import React, { useState } from "react";
import { Navbar } from "./components/Navbar";
import { LandingPage } from "./components/LandingPage";
import { CreationWorkbench } from "./components/CreationWorkbench";
import { EngineeringWorkbench } from "./components/EngineeringWorkbench";
import { DEFAULT_ROBOT_PROJECT, DEFAULT_PLANT_PROJECT, DEFAULT_SPEAKER_PROJECT } from "./data/defaults";
import { HardwareProject, PageId } from "./types";
import confetti from "canvas-confetti";

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>("page-landing");
  const [currentProject, setCurrentProject] = useState<HardwareProject>(DEFAULT_ROBOT_PROJECT);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isIterating, setIsIterating] = useState(false);
  const [highlightedKey, setHighlightedKey] = useState<string | undefined>(undefined);

  // Handle building from preset or prompt
  const handleStartBuild = async (presetOrPrompt: string | HardwareProject) => {
    if (typeof presetOrPrompt !== "string") {
      setCurrentProject(presetOrPrompt);
      setCurrentPage("page-workbench");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const prompt = presetOrPrompt.trim();
    if (!prompt) {
      setCurrentProject(DEFAULT_ROBOT_PROJECT);
      setCurrentPage("page-workbench");
      return;
    }

    // Call Backend AI Generator
    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate-hardware", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, action: "new" }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.project) {
          setCurrentProject(data.project);
          setCurrentPage("page-workbench");
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
      }
      // If network or parsing issue, select closest preset
      if (prompt.includes("植物") || prompt.includes("花") || prompt.includes("土")) {
        setCurrentProject({ ...DEFAULT_PLANT_PROJECT, desc: prompt });
      } else if (prompt.includes("音箱") || prompt.includes("音乐") || prompt.includes("声")) {
        setCurrentProject({ ...DEFAULT_SPEAKER_PROJECT, desc: prompt });
      } else {
        setCurrentProject({ ...DEFAULT_ROBOT_PROJECT, title: `${prompt.slice(0, 10)} 创意项目`, desc: prompt });
      }
      setCurrentPage("page-workbench");
    } catch (err) {
      console.error("Generate hardware error:", err);
      setCurrentProject({ ...DEFAULT_ROBOT_PROJECT, desc: prompt });
      setCurrentPage("page-workbench");
    } finally {
      setIsGenerating(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Handle incremental iteration from AI chat bar
  const handleIterateProject = async (prompt: string) => {
    setIsIterating(true);
    try {
      const res = await fetch("/api/generate-hardware", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          currentProject,
          action: "iterate",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.project) {
          setCurrentProject(data.project);
          confetti({
            particleCount: 40,
            spread: 50,
            origin: { y: 0.8 },
          });
          return;
        }
      }

      // Local fallback simulation if endpoint is unreachable
      const prevVersion = currentProject.version || "V1.0";
      const nextVerNum = (parseFloat(prevVersion.replace("V", "")) + 0.1).toFixed(1);
      const newVersion = `V${nextVerNum}`;

      setCurrentProject((prev) => ({
        ...prev,
        version: newVersion,
        desc: `${prev.desc} (已适配修改: ${prompt})`,
        price: (prev.components.reduce((s, c) => s + c.price * c.quantity, 0) + 18),
        diff: {
          summary: `${newVersion} 本次更新概览：根据「${prompt.slice(0, 15)}...」调整了结构与模块配置。`,
          addedAbilities: ["+动作表达与姿态自适应"],
          addedModules: ["+SG90 微型金属齿轮舵机x2"],
          priceDelta: "￥128 → ￥146",
        },
      }));
    } catch (err) {
      console.error("Iterate error:", err);
    } finally {
      setIsIterating(false);
    }
  };

  const handleConfirmPlan = () => {
    setCurrentPage("page-engineering");
    window.scrollTo({ top: 0, behavior: "smooth" });
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  const handleBackToWorkbench = () => {
    setCurrentPage("page-workbench");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="bg-[#f8fafc] text-slate-800 min-h-screen flex flex-col font-sans">
      {/* TOP NAVBAR */}
      <Navbar
        currentPage={currentPage}
        onNavigate={(page) => {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        projectTitle={currentProject.title}
        projectVersion={currentProject.version}
      />

      {/* MAIN VIEW CONTROLLER */}
      <main className="flex-1 flex flex-col">
        {currentPage === "page-landing" && (
          <LandingPage
            onStartBuild={handleStartBuild}
            isLoading={isGenerating}
          />
        )}

        {currentPage === "page-workbench" && (
          <CreationWorkbench
            project={currentProject}
            onConfirmPlan={handleConfirmPlan}
            onIterateProject={handleIterateProject}
            isIterating={isIterating}
            onSelectHighlightKey={setHighlightedKey}
            highlightedKey={highlightedKey}
          />
        )}

        {currentPage === "page-engineering" && (
          <EngineeringWorkbench
            project={currentProject}
            onBackToWorkbench={handleBackToWorkbench}
            onSelectHighlightKey={setHighlightedKey}
          />
        )}
      </main>
    </div>
  );
}

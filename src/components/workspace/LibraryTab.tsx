"use client";

import React from "react";
import { Project, SavedAd } from "../../store/projectStore";

interface LibraryTabProps {
    activeTab: string;
    activeProject: Project | null;
    savedAds: SavedAd[];
    deleteSavedAd: (projectId: string, adId: string) => Promise<void>;
    handleLoadAdToGenerator: (ad: SavedAd) => void;
    showNotification: (type: "success" | "error", message: string) => void;
    openCreateModal: () => void;
    setPlatform: (platform: string) => void;
    setActiveTab: (tab: string) => void;
}

export default function LibraryTab({
    activeTab,
    activeProject,
    savedAds,
    deleteSavedAd,
    handleLoadAdToGenerator,
    showNotification,
    openCreateModal,
    setPlatform,
    setActiveTab
}: LibraryTabProps) {
    const currentPlatformId = activeTab.replace("saved-", "");

    const PLAT_META: Record<string, { label: string; icon: string; headerBg: string; badge: string; editBtn: string }> = {
        facebook:  { label: "Facebook",  icon: "🔵", headerBg: "bg-blue-500/8 border-blue-500/20",  badge: "bg-blue-500/15 text-blue-400 border-blue-500/30",  editBtn: "border-blue-700/40 bg-blue-950/30 text-blue-300 hover:bg-blue-900/40" },
        instagram: { label: "Instagram", icon: "📸", headerBg: "bg-pink-500/8 border-pink-500/20",  badge: "bg-pink-500/15 text-pink-400 border-pink-500/30",  editBtn: "border-pink-700/40 bg-pink-950/30 text-pink-300 hover:bg-pink-900/40" },
        linkedin:  { label: "LinkedIn",  icon: "💼", headerBg: "bg-teal-500/8 border-teal-500/20",  badge: "bg-teal-500/15 text-teal-400 border-teal-500/30",  editBtn: "border-teal-700/40 bg-teal-950/30 text-teal-300 hover:bg-teal-900/40" },
        x:         { label: "X (Twitter)",icon: "🐦", headerBg: "bg-slate-700/15 border-slate-600/30", badge: "bg-slate-700/30 text-slate-300 border-slate-600/40", editBtn: "border-slate-600/40 bg-slate-800/30 text-slate-300 hover:bg-slate-700/40" },
    };

    const meta = PLAT_META[currentPlatformId] || PLAT_META.facebook;

    const filteredAds = savedAds.filter((ad) => ad.platform === currentPlatformId);

    return (
        <div className="space-y-6 text-xs animate-fade-in">
            {/* Library header */}
            <div className={`flex items-center justify-between px-5 py-3.5 rounded-2xl border ${meta.headerBg}`}>
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{meta.icon}</span>
                    <div>
                        <h2 className="text-sm font-bold text-white">{meta.label} ბიბლიოთეკა</h2>
                        <p className="text-[10px] text-slate-500 mt-0.5">შენახული პოსტები · {activeProject?.name || "—"}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {filteredAds.length > 0 && (
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${meta.badge}`}>
                            {filteredAds.length} პოსტი
                        </span>
                    )}
                    <button
                        onClick={() => { setPlatform(currentPlatformId); setActiveTab("generator"); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-600/10"
                    >
                        🚀 ახალი პოსტი
                    </button>
                </div>
            </div>

            {!activeProject ? (
                <div className="glass-panel rounded-2xl p-12 text-center text-slate-500 max-w-md mx-auto">
                    <p className="text-sm font-semibold mb-2">საქმიანობის პროფილი არ არსებობს</p>
                    <button onClick={openCreateModal} className="text-xs font-bold text-indigo-400 hover:underline">
                        შექმენით საქმიანობა და დაიწყეთ
                    </button>
                </div>
            ) : filteredAds.length === 0 ? (
                <div className="glass-panel rounded-2xl p-12 text-center text-slate-500 flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl border border-slate-800 bg-slate-900/50 flex items-center justify-center text-3xl">
                        {meta.icon}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-400">{meta.label}-ის პოსტები ჯერ არ არის</p>
                        <p className="text-xs text-slate-600 mt-1">შექმენით პირველი პოსტი გენერატორის გამოყენებით</p>
                    </div>
                    <button
                        onClick={() => { setPlatform(currentPlatformId); setActiveTab("generator"); }}
                        className="mt-1 px-5 py-2.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-600/10"
                    >
                        🚀 პოსტის შექმნა
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-fade-in">
                    {filteredAds.map((ad) => (
                        <div
                            key={ad.id}
                            className="group relative glass-panel rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl hover:shadow-black/30 hover:-translate-y-0.5"
                        >
                            {/* Card image */}
                            {ad.image_url && (
                                <div className="relative h-36 bg-slate-900 overflow-hidden shrink-0">
                                    <img
                                        src={ad.image_url}
                                        alt="Post Image"
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                </div>
                            )}

                            {/* Card body */}
                            <div className="p-4 flex flex-col flex-1 space-y-3">
                                {/* Platform + Tone badge */}
                                <div className="flex items-center justify-between">
                                    <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full border ${meta.badge}`}>
                                        {meta.icon} {meta.label} · {ad.tone}
                                    </span>
                                    {/* Delete button */}
                                    <button
                                        onClick={() => activeProject && deleteSavedAd(activeProject.id, ad.id)}
                                        className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-rose-400 transition-all text-xs p-1 rounded-lg hover:bg-rose-950/30"
                                        title="წაშლა"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Headline */}
                                <h3 className="font-bold text-sm text-white leading-snug line-clamp-1">
                                    {ad.headline || "პოსტი"}
                                </h3>

                                {/* Post text — clipped, expands on hover via overlay */}
                                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed whitespace-pre-line flex-1">
                                    {ad.text}
                                </p>

                                {ad.cta && (
                                    <p className="text-[10px] text-indigo-400 font-bold border-l-2 border-indigo-500/40 pl-2">
                                        CTA: {ad.cta}
                                    </p>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2 pt-1">
                                    <button
                                        onClick={() => handleLoadAdToGenerator(ad)}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold rounded-xl border transition-all ${meta.editBtn}`}
                                    >
                                        ✏️ რედაქტირება
                                    </button>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${ad.text}\n\n${ad.cta}`);
                                            showNotification("success", "ტექსტი წარმატებით კოპირდა!");
                                        }}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold rounded-xl border border-slate-700/50 bg-slate-900/50 text-slate-300 hover:bg-slate-800/60 transition-all"
                                    >
                                        📋 კოპირება
                                    </button>
                                </div>
                            </div>

                            {/* ── FULL POST HOVER OVERLAY ── */}
                            <div className="absolute inset-0 rounded-2xl bg-slate-950/97 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col p-5 overflow-y-auto pointer-events-none group-hover:pointer-events-auto">
                                {/* Overlay header */}
                                <div className="flex items-center justify-between mb-3 shrink-0">
                                    <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full border ${meta.badge}`}>
                                        {meta.icon} {meta.label} · {ad.tone}
                                    </span>
                                    <span className="text-[9px] text-slate-600 font-semibold">სრული ტექსტი</span>
                                </div>

                                {/* Full headline */}
                                {ad.headline && (
                                    <h3 className="text-sm font-bold text-white mb-2 leading-snug shrink-0">
                                        {ad.headline}
                                    </h3>
                                )}

                                {/* Full post text */}
                                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line flex-1">
                                    {ad.text}
                                </p>

                                {ad.cta && (
                                    <p className="text-[10px] text-indigo-400 font-bold mt-2 border-l-2 border-indigo-500/40 pl-2 shrink-0">
                                        CTA: {ad.cta}
                                    </p>
                                )}

                                {/* Overlay actions */}
                                <div className="flex gap-2 mt-4 shrink-0">
                                    <button
                                        onClick={() => handleLoadAdToGenerator(ad)}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl border transition-all ${meta.editBtn}`}
                                    >
                                        ✏️ რედაქტირება
                                    </button>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${ad.text}\n\n${ad.cta}`);
                                            showNotification("success", "ტექსტი წარმატებით კოპირდა!");
                                        }}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl border border-slate-700/50 bg-slate-900/50 text-slate-300 hover:bg-slate-800/60 transition-all"
                                    >
                                        📋 კოპირება
                                    </button>
                                    <button
                                        onClick={() => activeProject && deleteSavedAd(activeProject.id, ad.id)}
                                        className="p-2.5 text-slate-600 hover:text-rose-400 transition-all rounded-xl border border-slate-800 hover:bg-rose-950/30 hover:border-rose-900/50"
                                        title="წაშლა"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

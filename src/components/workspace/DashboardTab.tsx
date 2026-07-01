"use client";

import React from "react";
import { SavedAd } from "../../store/projectStore";
import { CalendarEvent } from "../GoniflowCalendar";

interface DashboardTabProps {
    savedAds: SavedAd[];
    calendarEvents: CalendarEvent[];
    setActiveTab: (tab: string) => void;
}

export default function DashboardTab({ savedAds, calendarEvents, setActiveTab }: DashboardTabProps) {
    const getSavedCountByPlatform = (platformId: string) => {
        return savedAds.filter((ad) => ad.platform === platformId).length;
    };

    return (
        <div className="space-y-8 animate-fade-in text-xs">
            {/* Stats grid */}
            <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">სტატისტიკა</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                    {/* Total */}
                    <div className="glass-panel rounded-2xl p-5 space-y-2 col-span-2 md:col-span-1 xl:col-span-1">
                        <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-indigo-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                            </svg>
                        </div>
                        <p className="text-3xl font-black text-white">{savedAds.length}</p>
                        <p className="text-xs text-slate-500 font-semibold">სულ პოსტი</p>
                    </div>
                    {/* Per-platform */}
                    {[
                        { id: "facebook",  label: "Facebook",  icon: "🔵", cls: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
                        { id: "instagram", label: "Instagram", icon: "📸", cls: "bg-pink-500/10 border-pink-500/20 text-pink-400" },
                        { id: "linkedin",  label: "LinkedIn",  icon: "💼", cls: "bg-teal-500/10 border-teal-500/20 text-teal-400" },
                        { id: "x",         label: "X",         icon: "🐦", cls: "bg-slate-700/20 border-slate-700/40 text-slate-300" },
                    ].map(p => (
                        <div key={p.id} className="glass-panel rounded-2xl p-5 space-y-2">
                            <div className={`h-9 w-9 rounded-xl border flex items-center justify-center text-base ${p.cls}`}>
                                {p.icon}
                            </div>
                            <p className="text-3xl font-black text-white">{getSavedCountByPlatform(p.id)}</p>
                            <p className="text-xs text-slate-500 font-semibold">{p.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Schedule summary */}
            <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">მომავალი ჩანაწერები</h2>
                {calendarEvents.length === 0 ? (
                    <div className="glass-panel rounded-2xl p-8 text-center text-slate-600 space-y-3">
                        <p className="text-sm font-semibold">განრიგი ჯერ არ არის დაყენებული</p>
                        <button onClick={() => setActiveTab("calendar")} className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
                            ➕ განრიგის გახსნა
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {[...calendarEvents]
                            .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                            .slice(0, 5)
                            .map(ev => {
                                const PLAT_COLORS: Record<string, string> = {
                                    facebook: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                                    instagram: "bg-pink-500/10 text-pink-400 border-pink-500/20",
                                    linkedin: "bg-teal-500/10 text-teal-400 border-teal-500/20",
                                    x: "bg-slate-700/20 text-slate-300 border-slate-700/40",
                                };
                                const PLAT_ICONS: Record<string, string> = { facebook: "🔵", instagram: "📸", linkedin: "💼", x: "🐦" };
                                return (
                                    <div key={ev.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-800 bg-slate-950/40">
                                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg border ${PLAT_COLORS[ev.platform] || ""}`}>
                                            {PLAT_ICONS[ev.platform]} {ev.platform.charAt(0).toUpperCase() + ev.platform.slice(1)}
                                        </span>
                                        <span className="text-xs text-white font-semibold flex-1 truncate">
                                            {ev.headline || ev.platform}
                                        </span>
                                        <span className="text-[10px] text-slate-500 shrink-0">
                                            {new Date(ev.start).toLocaleDateString("ka-GE", { day: "numeric", month: "short" })}
                                        </span>
                                    </div>
                                );
                            })}
                        {calendarEvents.length > 5 && (
                            <button
                                onClick={() => setActiveTab("calendar")}
                                className="w-full text-center text-xs font-bold text-indigo-400 hover:text-indigo-300 py-2 transition-colors"
                            >
                                ყველა {calendarEvents.length} ჩანაწერის ნახვა →
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Recent Posts */}
            <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">ბოლო პოსტები</h2>
                {savedAds.length === 0 ? (
                    <div className="glass-panel rounded-2xl p-8 text-center text-slate-600 space-y-3">
                        <p className="text-sm font-semibold">შენახული პოსტი არ არსებობს</p>
                        <button onClick={() => setActiveTab("generator")} className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                            ✨ პირველი პოსტის შექმნა
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {[...savedAds].reverse().slice(0, 6).map(ad => {
                            const PLAT_COLORS: Record<string, string> = {
                                facebook: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                                instagram: "bg-pink-500/10 text-pink-400 border-pink-500/20",
                                linkedin: "bg-teal-500/10 text-teal-400 border-teal-500/20",
                                x: "bg-slate-700/20 text-slate-300 border-slate-700/40",
                            };
                            const PLAT_ICONS: Record<string, string> = { facebook: "🔵", instagram: "📸", linkedin: "💼", x: "🐦" };
                            const PLAT_LABELS: Record<string, string> = { facebook: "Facebook", instagram: "Instagram", linkedin: "LinkedIn", x: "X" };
                            return (
                                <div key={ad.id} className="glass-panel rounded-2xl p-4 space-y-3">
                                    <div className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2 py-0.5 rounded-full border ${PLAT_COLORS[ad.platform] || ""}`}>
                                        {PLAT_ICONS[ad.platform]} {PLAT_LABELS[ad.platform] || ad.platform}
                                    </div>
                                    <p className="text-xs font-bold text-white line-clamp-1">{ad.headline || "პოსტი"}</p>
                                    <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">{ad.text}</p>
                                    {ad.cta && <p className="text-[10px] text-indigo-400 font-bold">CTA: {ad.cta}</p>}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

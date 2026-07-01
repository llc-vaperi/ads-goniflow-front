"use client";

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useProjectStore } from "../../../store/projectStore";
import GoniflowCalendar, { CalendarEvent } from "../../../components/GoniflowCalendar";

export default function CalendarPage() {
    const router = useRouter();
    const {
        calendarEvents,
        pendingCalendarEvent,
        setPendingCalendarEvent,
        addCalendarEvent,
        updateCalendarEvent,
        deleteCalendarEvent,
        setScheduleTargetDate,
        setEditingCalendarEvent,
        setEditorPlatform,
        setEditorTone,
        setEditorPrompt,
        setEditorImagePrompt,
        setEditorUploadedImage,
        setEditorUploadedImageName
    } = useProjectStore();

    const handleNavigateToGenerator = useCallback((isoDateTime: string) => {
        setScheduleTargetDate(isoDateTime);
        router.push("/profile/generator");
    }, [setScheduleTargetDate, router]);

    const handleNavigateToGeneratorForEdit = useCallback((event: CalendarEvent) => {
        setEditingCalendarEvent(event);
        setEditorPlatform(event.platform);
        setEditorTone(event.tone);
        setEditorPrompt(event.headline || event.text || "");
        setEditorImagePrompt("");
        setEditorUploadedImage(null);
        setEditorUploadedImageName(null);
        router.push("/profile/generator");
    }, [
        setEditingCalendarEvent,
        setEditorPlatform,
        setEditorTone,
        setEditorPrompt,
        setEditorImagePrompt,
        setEditorUploadedImage,
        setEditorUploadedImageName,
        router
    ]);

    const totalScheduledPerWeek = calendarEvents.length;

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Header row */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Google Calendar-ის მსგავსი სრული განრიგი. დააჭირეთ ნებისმიერ დღეს ახალი ჩანაწერის დასამატებლად.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {totalScheduledPerWeek > 0 && (
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                            {totalScheduledPerWeek} ჩანაწერი
                        </span>
                    )}
                    <button
                        onClick={() => {
                            setEditorPlatform("facebook");
                            setEditorTone("professional");
                            router.push("/profile/generator");
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-600/10"
                    >
                        🚀 პოსტის შექმნა
                    </button>
                </div>
            </div>

            {/* Platform legend */}
            <div className="flex items-center gap-3 flex-wrap">
                {[
                    { label: "Facebook",  color: "#3b82f6" },
                    { label: "Instagram", color: "#ec4899" },
                    { label: "LinkedIn",  color: "#14b8a6" },
                    { label: "X",         color: "#94a3b8" },
                ].map(p => (
                    <span key={p.label} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                        {p.label}
                    </span>
                ))}
            </div>

            {/* Full Calendar */}
            <GoniflowCalendar
                events={calendarEvents}
                onAddEvent={addCalendarEvent}
                onUpdateEvent={updateCalendarEvent}
                onDeleteEvent={deleteCalendarEvent}
                onNavigateToGenerator={handleNavigateToGenerator}
                onNavigateToGeneratorForEdit={handleNavigateToGeneratorForEdit}
                pendingEvent={pendingCalendarEvent}
                onPendingEventConsumed={() => setPendingCalendarEvent(null)}
            />
        </div>
    );
}

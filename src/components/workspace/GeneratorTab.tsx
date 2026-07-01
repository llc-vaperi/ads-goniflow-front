"use client";

import React, { useRef, useState } from "react";
import { Project, SavedAd } from "../../store/projectStore";
import { generateMockAd, GeneratedAd } from "../../utils/mockGenerator";
import SocialPreview from "../SocialPreview";
import { CalendarEvent } from "../GoniflowCalendar";

interface GeneratorTabProps {
    activeProject: Project | null;
    openCreateModal: () => void;
    userEmail: string;
    saveAd: (projectId: string, ad: Omit<SavedAd, "id" | "project_id">) => Promise<void>;
    showNotification: (type: "success" | "error", message: string) => void;
    setActiveTab: (tab: string) => void;

    // Inputs & state passed down from parent
    prompt: string;
    setPrompt: (val: string) => void;
    imagePrompt: string;
    setImagePrompt: (val: string) => void;
    platform: string;
    setPlatform: (val: string) => void;
    tone: string;
    setTone: (val: string) => void;
    uploadedImage: string | null;
    setUploadedImage: (val: string | null) => void;
    uploadedImageName: string | null;
    setUploadedImageName: (val: string | null) => void;
    generatedAd: GeneratedAd | null;
    setGeneratedAd: (ad: GeneratedAd | null) => void;

    // Calendar integrations
    scheduleTargetDate: string | null;
    setScheduleTargetDate: (date: string | null) => void;
    editingCalendarEvent: CalendarEvent | null;
    setEditingCalendarEvent: (event: CalendarEvent | null) => void;
    handleCalendarAddEvent: (ev: Omit<CalendarEvent, "id">) => void;
    handleCalendarUpdateEvent: (id: string, changes: Partial<CalendarEvent>) => void;
    setPendingCalendarEvent: (event: Omit<CalendarEvent, "id" | "start"> | null) => void;
}

export default function GeneratorTab({
    activeProject,
    openCreateModal,
    userEmail,
    saveAd,
    showNotification,
    setActiveTab,

    prompt,
    setPrompt,
    imagePrompt,
    setImagePrompt,
    platform,
    setPlatform,
    tone,
    setTone,
    uploadedImage,
    setUploadedImage,
    uploadedImageName,
    setUploadedImageName,
    generatedAd,
    setGeneratedAd,

    scheduleTargetDate,
    setScheduleTargetDate,
    editingCalendarEvent,
    setEditingCalendarEvent,
    handleCalendarAddEvent,
    handleCalendarUpdateEvent,
    setPendingCalendarEvent
}: GeneratorTabProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);

    // Image upload handlers
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadedImageName(file.name);
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setUploadedImage(null);
        setUploadedImageName(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleGenerate = () => {
        if (!activeProject) return;
        setIsGenerating(true);
        setGeneratedAd(null);

        setTimeout(() => {
            const result = generateMockAd({
                textPrompt: prompt,
                imagePrompt,
                uploadedImage: uploadedImage || undefined,
                platform,
                tone,
                projectName: activeProject.name,
                projectDescription: activeProject.description,
                projectLink: activeProject.link,
            });
            setGeneratedAd(result);
            setIsGenerating(false);
        }, 1600);
    };

    const handleDirectAddToCalendar = () => {
        if (!scheduleTargetDate) return;

        handleCalendarAddEvent({
            title: platform,
            start: scheduleTargetDate,
            platform,
            tone,
            headline: prompt.trim() || `${platform.toUpperCase()} ჩანაწერი`,
            text: prompt.trim() || `${platform.toUpperCase()} ჩანაწერი`,
            cta: "",
            allDay: false,
        });

        // Reset inputs and return to calendar
        setScheduleTargetDate(null);
        setPrompt("");
        setImagePrompt("");
        setUploadedImage(null);
        setUploadedImageName(null);
        setGeneratedAd(null);
        setActiveTab("calendar");
    };

    const handleUpdateCalendarEventFromEdit = () => {
        if (!editingCalendarEvent) return;

        handleCalendarUpdateEvent(editingCalendarEvent.id, {
            platform,
            tone,
            headline: prompt.trim() || `${platform.toUpperCase()} ჩანაწერი`,
            text: prompt.trim() || `${platform.toUpperCase()} ჩანაწერი`,
        });

        // Reset inputs and return to calendar
        setEditingCalendarEvent(null);
        setPrompt("");
        setImagePrompt("");
        setUploadedImage(null);
        setUploadedImageName(null);
        setGeneratedAd(null);
        setActiveTab("calendar");
        showNotification("success", "განრიგის ჩანაწერი წარმატებით განახლდა!");
    };

    const handleSave = async () => {
        if (!generatedAd || !activeProject) return;
        try {
            await saveAd(activeProject.id, {
                platform,
                tone,
                headline: generatedAd.headline || "",
                text: generatedAd.text,
                cta: generatedAd.cta || "",
                image_url: generatedAd.imageUrl || ""
            });
            showNotification("success", "პოსტი წარმატებით შეინახა!");
        } catch (err) {
            showNotification("error", "შეცდომა პოსტის შენახვისას. სცადეთ თავიდან.");
        }
    };

    const handleCopy = () => {
        if (!generatedAd) return;
        const fullText = `${generatedAd.text}\n\n${generatedAd.hashtags.join(" ")}\n\n${generatedAd.cta}`;
        navigator.clipboard.writeText(fullText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleResetAll = () => {
        setPrompt("");
        setImagePrompt("");
        setUploadedImage(null);
        setUploadedImageName(null);
        setScheduleTargetDate(null);
        setEditingCalendarEvent(null);
    };

    if (!activeProject) {
        return (
            <div className="glass-panel rounded-2xl p-12 text-center max-w-lg mx-auto space-y-6">
                <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/5">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                </div>
                <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white">საქმიანობის პროფილი არ არსებობს</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">პოსტების გენერირებისთვის ჯერ უნდა შექმნათ მინიმუმ ერთი საქმიანობა (პროექტი), სადაც მიუთითებთ ვებსაიტს, აღწერასა და ლოგოს.</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 px-6 rounded-xl shadow-lg transition-all"
                >
                    ➕ პირველი საქმიანობის შექმნა
                </button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start h-full">
            {/* Left: Input Form */}
            <div className="glass-panel rounded-2xl p-6 space-y-6">
                {/* ── Calendar target date banner ── */}
                {scheduleTargetDate && (
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/8 animate-pulse-once">
                        <span className="text-emerald-400">📅</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-emerald-300">קალენდარში დამატება:</p>
                            <p className="text-[10px] text-emerald-400/70">
                                {new Date(scheduleTargetDate).toLocaleDateString("ka-GE", { day: "numeric", month: "long", year: "numeric" })}
                                {" "}
                                {new Date(scheduleTargetDate).toLocaleTimeString("ka-GE", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                        </div>
                        <button
                            onClick={() => setScheduleTargetDate(null)}
                            className="text-emerald-600 hover:text-emerald-400 transition-colors text-xs"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* ── Calendar edit event banner ── */}
                {editingCalendarEvent && (
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-indigo-500/30 bg-indigo-500/8 animate-pulse-once">
                        <span className="text-indigo-400">✏️</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-indigo-300">განრიგის ჩანაწერის რედაქტირება:</p>
                            <p className="text-[10px] text-indigo-400/70">
                                {new Date(editingCalendarEvent.start).toLocaleDateString("ka-GE", { day: "numeric", month: "long", year: "numeric" })}
                                {" "}
                                {new Date(editingCalendarEvent.start).toLocaleTimeString("ka-GE", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setEditingCalendarEvent(null);
                                setPrompt("");
                            }}
                            className="text-indigo-600 hover:text-indigo-400 transition-colors text-xs"
                        >
                            ✕
                        </button>
                    </div>
                )}

                <div>
                    <div className="flex items-center justify-between mb-1">
                        <h2 className="text-base font-bold text-white">პოსტის შექმნა</h2>
                    </div>
                    {/* Smart Mode Indicator */}
                    <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                        {prompt.trim() ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">📝 ტექსტი: პრომპტი</span>
                        ) : uploadedImage && !imagePrompt.trim() ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">🔍 ტექსტი: სურათის ანალიზი</span>
                        ) : imagePrompt.trim() ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">🔍 ტექსტი: სური.კონტ.</span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-700/30 text-slate-500 border border-slate-700/40">✨ ტექსტი: ავტო</span>
                        )}
                        <span className="text-slate-800">·</span>
                        {uploadedImage && imagePrompt.trim() ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30">✨ სური.: ატვ.+რედ.</span>
                        ) : uploadedImage ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">📸 სური.: ატვირთული</span>
                        ) : imagePrompt.trim() ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">🎨 სური.: გენ.პრომ.</span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-700/30 text-slate-500 border border-slate-700/40">🖼️ სური.: სტოკი</span>
                        )}
                    </div>
                </div>

                {/* ── IMAGE SECTION ── */}
                <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            <span>🖼️</span> სურათი
                        </label>
                        <span className="text-[10px] text-slate-600 font-medium">სურვილისამებრ</span>
                    </div>

                    {/* Upload area */}
                    {!uploadedImage ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border border-dashed border-slate-800 hover:border-amber-500/40 rounded-xl p-4 text-center cursor-pointer bg-slate-950/20 hover:bg-amber-500/[0.02] transition-all group"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-slate-600 group-hover:text-amber-400 mx-auto mb-1.5 transition-colors">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                            <span className="text-xs text-slate-500 group-hover:text-slate-300 font-semibold transition-colors block">სურათის ატვირთვა</span>
                            <span className="text-[10px] text-slate-700 mt-0.5 block">AI გაანალიზებს ფოტოს შინაარსს</span>
                        </div>
                    ) : (
                        <div className="relative rounded-xl border border-amber-800/30 bg-amber-950/10 p-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <img
                                    src={uploadedImage}
                                    alt="Uploaded"
                                    className="w-11 h-11 rounded-lg object-cover border border-amber-800/30 shrink-0"
                                />
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-white truncate">{uploadedImageName}</p>
                                    <p className="text-[10px] text-amber-400 font-bold flex items-center gap-1 mt-0.5">
                                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                                        {imagePrompt.trim() ? "ახალი სური. გენერირდება" : "ანალიზი + ტექსტი"}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleRemoveImage}
                                className="h-7 w-7 rounded-lg border border-slate-800 hover:border-rose-800/50 bg-slate-900/60 hover:bg-rose-950/30 text-slate-500 hover:text-rose-400 text-xs transition-all shrink-0 flex items-center justify-center"
                                title="სურათის წაშლა"
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept="image/*"
                        className="hidden"
                    />

                    {/* Separator */}
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-px bg-slate-800/60" />
                        <span className="text-[9px] text-slate-600 font-bold whitespace-nowrap">
                            {uploadedImage ? "ატვ. სური. + სური. პრომპტი" : "სურათის პრომპტი"}
                        </span>
                        <div className="flex-1 h-px bg-slate-800/60" />
                    </div>

                    {/* Image Prompt */}
                    <div className="space-y-1">
                        <textarea
                            id="image-prompt"
                            rows={2}
                            value={imagePrompt}
                            onChange={(e) => setImagePrompt(e.target.value)}
                            placeholder={
                                uploadedImage
                                    ? "ცარიელი = ატვ.სური.+ტექსტის ავტო ანალიზი\nპრომპტი = ატვ.სური.-ით ახალი სური. შეიქმნება"
                                    : "სურათის გენერაციის ინსტრუქცია... (ცარიელი = სტოკ სური.)"
                            }
                            className="w-full rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-slate-100 placeholder-slate-600 outline-none transition-all focus:border-rose-500/40 focus:ring-2 focus:ring-rose-500/10 text-xs leading-relaxed"
                        />
                        {uploadedImage && imagePrompt.trim() && (
                            <p className="text-[10px] text-purple-400 font-bold flex items-center gap-1">
                                ✨ ატვ.სური. + პრომპტი → ახალი სურათი გენერირდება
                            </p>
                        )}
                    </div>
                </div>

                {/* ── TEXT PROMPT ── */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label htmlFor="text-prompt" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            <span>📝</span> ტექსტის პრომპტი
                        </label>
                        <span className="text-[10px] text-slate-600 font-medium">სურვილისამებრ</span>
                    </div>
                    <textarea
                        id="text-prompt"
                        rows={3}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="პოსტის ტექსტის ინსტრუქცია... (ცარიელი = ავტო გენერირება)"
                        className="w-full rounded-xl border border-slate-800 bg-slate-950/50 p-3.5 text-slate-100 placeholder-slate-600 shadow-inner outline-none transition-all focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 text-sm leading-relaxed"
                    />
                </div>

                {/* Platform Selector */}
                <div className="space-y-2">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">სოციალური ქსელი</span>
                    <div className="grid grid-cols-4 gap-2">
                        {[
                            { id: "facebook", name: "Facebook", color: "hover:border-blue-500/40 hover:bg-blue-500/5" },
                            { id: "instagram", name: "Instagram", color: "hover:border-pink-500/40 hover:bg-pink-500/5" },
                            { id: "linkedin", name: "LinkedIn", color: "hover:border-teal-500/40 hover:bg-teal-500/5" },
                            { id: "x", name: "X (Twitter)", color: "hover:border-slate-300/40 hover:bg-slate-300/5" }
                        ].map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setPlatform(p.id)}
                                className={`py-3 px-2 rounded-xl border text-xs font-bold text-center transition-all ${
                                    platform === p.id
                                        ? "border-indigo-500 bg-indigo-500/10 text-white"
                                        : `border-slate-800 bg-slate-950/20 text-slate-400 ${p.color}`
                                }`}
                            >
                                {p.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tone of Voice Selector */}
                <div className="space-y-2">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">ტონი (Tone of Voice)</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                            { id: "professional", name: "💼 ოფიციალური" },
                            { id: "friendly", name: "👋 მეგობრული" },
                            { id: "funny", name: "😎 ხუმარა" },
                            { id: "bold", name: "💥 მბზინავი" }
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setTone(t.id)}
                                className={`py-2 px-1.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                                    tone === t.id
                                        ? "border-indigo-500 bg-indigo-500/10 text-white"
                                        : "border-slate-800 bg-slate-950/20 text-slate-400 hover:border-slate-700"
                                }`}
                            >
                                {t.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Generate Button — dynamic label */}
                {editingCalendarEvent ? (
                    <div className="flex gap-2 w-full">
                        <button
                            onClick={handleUpdateCalendarEventFromEdit}
                            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 transition-all active:scale-[0.98] animate-pulse-once"
                        >
                            ✏️ პოსტის რედაქტირება
                        </button>
                        <button
                            onClick={handleResetAll}
                            className="px-4 py-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-rose-400 text-xs font-bold transition-all"
                            title="გაუქმება"
                        >
                            გაუქმება
                        </button>
                    </div>
                ) : scheduleTargetDate ? (
                    <div className="flex gap-2 w-full">
                        <button
                            onClick={handleDirectAddToCalendar}
                            className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-2 transition-all active:scale-[0.98] animate-pulse-once"
                        >
                            📅 კალენდარში დამატება
                        </button>
                        <button
                            onClick={handleResetAll}
                            className="px-4 py-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-rose-400 text-xs font-bold transition-all"
                            title="გაუქმება"
                        >
                            გაუქმება
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !activeProject}
                        className={`w-full text-white font-bold text-sm py-3.5 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${
                            uploadedImage && imagePrompt.trim()
                                ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-purple-600/10"
                                : uploadedImage
                                ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-600/10"
                                : imagePrompt.trim()
                                ? "bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 shadow-rose-600/10"
                                : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-600/10"
                        }`}
                    >
                        {isGenerating ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                {uploadedImage && imagePrompt.trim()
                                    ? "სურათი რედაქტირდება..."
                                    : uploadedImage
                                    ? "სურათი ანალიზდება..."
                                    : imagePrompt.trim()
                                    ? "სური. გენერირდება..."
                                    : "AI გენერირებს..."}
                            </>
                        ) : (
                            <>
                                {uploadedImage && imagePrompt.trim()
                                    ? "✨ სურათის რედაქტირება + ტექსტი"
                                    : uploadedImage
                                    ? "🔍 სურათის ანალიზი + ტექსტი"
                                    : imagePrompt.trim() && prompt.trim()
                                    ? "🚀 ტექსტი + სურათი"
                                    : imagePrompt.trim()
                                    ? "🎨 სურათის გენერირება"
                                    : prompt.trim()
                                    ? "📝 ტექსტის გენერირება"
                                    : "🚀 ავტო გენერირება"}
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Right: Live Preview Panel */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">რეალური Live Preview</h2>
                    {generatedAd && (
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={handleCopy}
                                className="px-3.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300 font-semibold text-xs hover:bg-slate-800 transition-all flex items-center gap-1.5"
                            >
                                {copied ? "✅ კოპირებულია!" : "📋 კოპირება"}
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-3.5 py-1.5 rounded-lg border border-indigo-800/40 bg-indigo-950/40 text-indigo-300 font-semibold text-xs hover:bg-indigo-950/80 transition-all flex items-center gap-1.5"
                            >
                                💾 შენახვა
                            </button>
                            {!scheduleTargetDate && (
                                <button
                                    onClick={() => {
                                        setPendingCalendarEvent({
                                            title: platform,
                                            platform,
                                            tone,
                                            headline: generatedAd.headline,
                                            text: generatedAd.text,
                                            cta: generatedAd.cta,
                                        });
                                        setActiveTab("calendar");
                                    }}
                                    className="px-3.5 py-1.5 rounded-lg border border-emerald-800/40 bg-emerald-950/40 text-emerald-300 font-semibold text-xs hover:bg-emerald-950/80 transition-all flex items-center gap-1.5"
                                >
                                    📅 განრიგში დამატება
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="glass-panel rounded-2xl p-6 min-h-[300px] flex flex-col justify-center">
                    {isGenerating ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <div className="relative w-12 h-12 flex items-center justify-center">
                                <div className="absolute inset-0 rounded-full border-4 border-indigo-500/10 border-t-indigo-500 animate-spin"></div>
                                <div className="w-6 h-6 rounded-full bg-indigo-500/20"></div>
                            </div>
                            <span className="text-slate-400 text-xs font-semibold animate-pulse">AI მუშაობს კამპანიის ტექსტზე...</span>
                        </div>
                    ) : (
                        <SocialPreview
                            platform={platform}
                            ad={generatedAd}
                            userEmail={userEmail}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

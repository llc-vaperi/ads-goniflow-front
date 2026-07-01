"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/authStore";
import { useProjectStore, Project } from "../../store/projectStore";
import { generateMockAd, GeneratedAd } from "../../utils/mockGenerator";
import SocialPreview from "../../components/SocialPreview";
import GoniflowCalendar, { CalendarEvent } from "../../components/GoniflowCalendar";

export default function WorkspacePage() {
    const { user, isLoading: isAuthLoading, isAuthenticated, logout } = useAuthStore();
    const { 
        projects, 
        activeProject, 
        savedAds, 
        isLoading: isProjectLoading, 
        fetchProjects, 
        createProject, 
        updateProject,
        deleteProject, 
        setActiveProject, 
        saveAd, 
        deleteSavedAd 
    } = useProjectStore();
    
    const router = useRouter();

    // Generator Campaign Prompt State
    const [prompt, setPrompt] = useState("");              // Text prompt
    const [imagePrompt, setImagePrompt] = useState("");    // Image generation/edit prompt
    const [platform, setPlatform] = useState("facebook");
    const [tone, setTone] = useState("professional");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedAd, setGeneratedAd] = useState<GeneratedAd | null>(null);
    
    // Image Upload State
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [uploadedImageName, setUploadedImageName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Copy state
    const [copied, setCopied] = useState(false);
    
    // Active Tab: generator | dashboard | calendar | saved-facebook | saved-instagram | saved-linkedin | saved-x
    const [activeTab, setActiveTab] = useState("generator");

    // Load a saved ad into the generator for editing
    const handleLoadAdToGenerator = (ad: import("../../store/projectStore").SavedAd) => {
        setPlatform(ad.platform);
        setTone(ad.tone);
        setPrompt(ad.headline || ad.text.split("\n")[0] || "");
        setImagePrompt("");
        setUploadedImage(ad.image_url && ad.image_url.startsWith("data:") ? ad.image_url : null);
        setUploadedImageName(null);
        setGeneratedAd({
            headline: ad.headline || "",
            text: ad.text,
            cta: ad.cta || "",
            imageUrl: ad.image_url || "",
            hashtags: [],
        });
        setActiveTab("generator");
    };

    // Custom Notification Modal
    const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const showNotification = (type: "success" | "error", message: string) => {
        setNotification({ type, message });
    };

    // ── Calendar Events State ──
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
    const [pendingCalendarEvent, setPendingCalendarEvent] = useState<Omit<CalendarEvent, "id" | "start"> | null>(null);
    const [scheduleTargetDate, setScheduleTargetDate] = useState<string | null>(null);
    const [editingCalendarEvent, setEditingCalendarEvent] = useState<CalendarEvent | null>(null);

    // Load calendar events from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem("goniflow_calendar_events");
            if (stored) setCalendarEvents(JSON.parse(stored));
        } catch {}
    }, []);

    // Persist calendar events to localStorage
    useEffect(() => {
        localStorage.setItem("goniflow_calendar_events", JSON.stringify(calendarEvents));
    }, [calendarEvents]);

    // CRUD handlers
    const handleCalendarAddEvent = useCallback((ev: Omit<CalendarEvent, "id">) => {
        const newEv: CalendarEvent = { ...ev, id: `cal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
        setCalendarEvents(prev => [...prev, newEv]);
        showNotification("success", "პოსტი განრიგში დაემატა!");
    }, []);

    const handleCalendarUpdateEvent = useCallback((id: string, changes: Partial<CalendarEvent>) => {
        setCalendarEvents(prev => prev.map(ev => ev.id === id ? { ...ev, ...changes } : ev));
    }, []);

    const handleCalendarDeleteEvent = useCallback((id: string) => {
        setCalendarEvents(prev => prev.filter(ev => ev.id !== id));
        showNotification("success", "ჩანაწერი წაიშალა!");
    }, []);

    const handleNavigateToGenerator = useCallback((isoDateTime: string) => {
        setScheduleTargetDate(isoDateTime);
        setActiveTab("generator");
    }, []);

    const handleNavigateToGeneratorForEdit = useCallback((event: CalendarEvent) => {
        setEditingCalendarEvent(event);
        setPlatform(event.platform);
        setTone(event.tone);
        setPrompt(event.headline || event.text || "");
        setImagePrompt("");
        setUploadedImage(null);
        setUploadedImageName(null);
        setActiveTab("generator");
    }, []);

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
        setUploadedImage(null);
        setUploadedImageName(null);
        setGeneratedAd(null);
        setActiveTab("calendar");
        showNotification("success", "განრიგის ჩანაწერი წარმატებით განახლდა!");
    };

    const totalScheduledPerWeek = calendarEvents.length;

    // Modal state for project creation/editing
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [projName, setProjName] = useState("");
    const [projLink, setProjLink] = useState("");
    const [projDesc, setProjDesc] = useState("");
    const [projLogo, setProjLogo] = useState("");
    const [projLogoFile, setProjLogoFile] = useState<string | null>(null); // base64 preview
    const [projLogoFileName, setProjLogoFileName] = useState<string | null>(null);
    const logoFileInputRef = useRef<HTMLInputElement>(null);
    const [isSubmittingProj, setIsSubmittingProj] = useState(false);

    // Dropdown toggle state
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Settings Modal State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Redirect to login if unauthenticated
    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [isAuthLoading, isAuthenticated, router]);

    // Fetch projects once logged in
    useEffect(() => {
        if (isAuthenticated) {
            fetchProjects();
        }
    }, [isAuthenticated, fetchProjects]);

    // Reset calendar slot mode when switching away from the generator tab
    useEffect(() => {
        if (activeTab !== "generator") {
            setScheduleTargetDate(null);
            setEditingCalendarEvent(null);
        }
    }, [activeTab]);

    const handleLogout = async () => {
        try {
            await logout();
            router.push("/login");
        } catch (err) {
            // Handled by store
        }
    };

    // Logo file upload handler
    const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProjLogoFileName(file.name);
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setProjLogoFile(base64);
                setProjLogo(base64); // store base64 as logo_url for now
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveLogoFile = () => {
        setProjLogoFile(null);
        setProjLogoFileName(null);
        setProjLogo("");
        if (logoFileInputRef.current) logoFileInputRef.current.value = "";
    };

    // Open project modal for creation
    const openCreateModal = () => {
        setEditingProject(null);
        setProjName("");
        setProjLink("");
        setProjDesc("");
        setProjLogo("");
        setProjLogoFile(null);
        setProjLogoFileName(null);
        setIsModalOpen(true);
    };

    // Open project modal for editing
    const openEditModal = (project: Project) => {
        setEditingProject(project);
        setProjName(project.name);
        setProjLink(project.link);
        setProjDesc(project.description);
        setProjLogo(project.logo_url);
        // Show existing logo as preview if it's a URL (not base64)
        if (project.logo_url && !project.logo_url.startsWith("data:")) {
            setProjLogoFile(project.logo_url);
            setProjLogoFileName("არსებული ლოგო");
        } else if (project.logo_url && project.logo_url.startsWith("data:")) {
            setProjLogoFile(project.logo_url);
            setProjLogoFileName("ატვირთული ლოგო");
        } else {
            setProjLogoFile(null);
            setProjLogoFileName(null);
        }
        setIsModalOpen(true);
    };

    const handleProjectSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projName.trim()) return;

        setIsSubmittingProj(true);
        const data = {
            name: projName,
            link: projLink,
            description: projDesc,
            logo_url: projLogo || "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&auto=format&fit=crop&q=80"
        };

        try {
            if (editingProject) {
                // Edit existing
                await updateProject(editingProject.id, data);
                showNotification("success", "საქმიანობა წარმატებით განახლდა!");
            } else {
                // Create new
                await createProject(data);
                showNotification("success", "საქმიანობა წარმატებით შეიქმნა!");
            }
            setIsModalOpen(false);
            setEditingProject(null);
        } catch (err) {
            showNotification("error", "შეცდომა ოპერაციის შესრულებისას. სცადეთ თავიდან.");
        } finally {
            setIsSubmittingProj(false);
        }
    };

    // Image upload handler
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
        setUploadedImage(null);
        setUploadedImageName(null);
        setGeneratedAd(null);
        setActiveTab("calendar");
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

    const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm("ნამდვილად გსურთ ამ საქმიანობის პროფილის წაშლა? წაიშლება ყველა შენახული პოსტიც.")) {
            await deleteProject(id);
        }
    };

    // Filter saved ads based on the active platform tab
    const getFilteredSavedAds = () => {
        if (!activeTab.startsWith("saved-")) return [];
        const activePlatform = activeTab.replace("saved-", "");
        return savedAds.filter((ad) => ad.platform === activePlatform);
    };

    const getSavedCountByPlatform = (plat: string) => {
        return savedAds.filter((ad) => ad.platform === plat).length;
    };

    if (isAuthLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-100 font-sans">
                <div className="flex flex-col items-center gap-4">
                    <svg className="animate-spin h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-slate-400 text-sm">იტვირთება...</span>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 font-sans">
            {/* Sidebar Navigation */}
            <aside className="w-66 border-r border-slate-800 bg-slate-950/80 backdrop-blur-xl flex flex-col justify-between p-6 shrink-0">
                <div className="space-y-6">
                    {/* Brand */}
                    <div 
                        onClick={() => router.push("/")}
                        className="flex items-center gap-3 cursor-pointer group hover:opacity-95 transition-all"
                        title="მთავარ გვერდზე გადასვლა"
                    >
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-102 transition-all">
                            <span className="font-extrabold text-white text-base">G</span>
                        </div>
                        <div>
                            <span className="font-black text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent group-hover:text-indigo-200 transition-colors">GoniFlow</span>
                            <span className="text-[10px] text-indigo-400 font-bold block leading-none">POST WORKSPACE</span>
                        </div>
                    </div>

                    {/* Project/Business Selector */}
                    <div className="relative pt-2">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">აქტიური საქმიანობა</label>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-900/40 text-left text-xs font-semibold transition-all"
                        >
                            <span className="truncate flex items-center gap-2">
                                {activeProject ? (
                                    <>
                                        <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                                        {activeProject.name}
                                    </>
                                ) : (
                                    <span className="text-slate-500">პროექტი არ არის</span>
                                )}
                            </span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 text-slate-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                            </svg>
                        </button>

                        {/* Project Select Dropdown Menu */}
                        {isDropdownOpen && (
                            <div className="absolute left-0 right-0 mt-2 z-30 rounded-xl border border-slate-800 bg-slate-950 p-1.5 shadow-2xl space-y-1">
                                {projects.map((p) => (
                                    <div key={p.id} className="flex items-center justify-between gap-0.5 hover:bg-slate-900 rounded-lg group px-1">
                                        <button
                                            onClick={() => {
                                                setActiveProject(p);
                                                setIsDropdownOpen(false);
                                            }}
                                            className="flex-1 text-left py-2 text-xs font-medium text-slate-200 truncate"
                                        >
                                            {p.name}
                                        </button>
                                        
                                        {/* Edit Project Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openEditModal(p);
                                                setIsDropdownOpen(false);
                                            }}
                                            className="p-1.5 text-slate-500 hover:text-indigo-400 transition-colors opacity-0 group-hover:opacity-100"
                                            title="რედაქტირება"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.83 20.062a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                            </svg>
                                        </button>

                                        {/* Delete Project Button */}
                                        <button
                                            onClick={(e) => handleDeleteProject(e, p.id)}
                                            className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                                            title="წაშლა"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                                <div className="border-t border-slate-800 my-1"></div>
                                <button
                                    onClick={openCreateModal}
                                    className="w-full text-center px-3 py-2 text-xs font-bold text-indigo-400 hover:bg-indigo-950/20 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                                >
                                    ➕ ახალი საქმიანობა
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Navigation Links */}
                    <nav className="space-y-1.5 pt-2">
                        {/* Dashboard */}
                        <button
                            onClick={() => setActiveTab("dashboard")}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                activeTab === "dashboard"
                                    ? "bg-violet-600 text-white shadow-lg shadow-violet-600/15"
                                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                            }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                            </svg>
                            Dashboard
                        </button>

                        {/* Calendar / Schedule */}
                        <button
                            onClick={() => setActiveTab("calendar")}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                activeTab === "calendar"
                                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/15"
                                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                            }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                            </svg>
                            განრიგი
                            {totalScheduledPerWeek > 0 && (
                                <span className="ml-auto px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    {totalScheduledPerWeek}
                                </span>
                            )}
                        </button>

                        {/* Post Generator */}
                        <div>
                            <button
                                onClick={() => setActiveTab("generator")}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                    activeTab === "generator"
                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/15"
                                        : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                                }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 21l8.982-8.983m-10.43 3.44 1.34-3.58 3.58-1.34-1.34-3.58-3.58 1.34ZM18 13.677 19.22 12.28a.2.2 0 0 0-.28-.28l-1.397 1.397a8.25 8.25 0 1 0-1.954 1.954l1.397-1.397a.2.2 0 0 0-.28-.28L15.32 18H18Z" />
                                </svg>
                                პოსტის შექმნა
                            </button>
                        </div>

                        {/* Platform Library Links */}
                        <div className="space-y-1">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 px-4 mb-2">შენახული პოსტები</span>

                            {([
                                { id: "facebook",  label: "Facebook",   icon: "🔵", activeColor: "bg-blue-600/20 text-blue-300 border border-blue-500/30",  hoverColor: "hover:bg-blue-900/20 hover:text-blue-300",  badgeCls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
                                { id: "instagram", label: "Instagram",  icon: "📸", activeColor: "bg-pink-600/20 text-pink-300 border border-pink-500/30",  hoverColor: "hover:bg-pink-900/20 hover:text-pink-300",  badgeCls: "bg-pink-500/15 text-pink-400 border-pink-500/30" },
                                { id: "linkedin",  label: "LinkedIn",   icon: "💼", activeColor: "bg-teal-600/20 text-teal-300 border border-teal-500/30",  hoverColor: "hover:bg-teal-900/20 hover:text-teal-300",  badgeCls: "bg-teal-500/15 text-teal-400 border-teal-500/30" },
                                { id: "x",         label: "X (Twitter)",icon: "🐦", activeColor: "bg-slate-700/40 text-slate-200 border border-slate-600/40", hoverColor: "hover:bg-slate-800/40 hover:text-slate-200", badgeCls: "bg-slate-700/30 text-slate-300 border-slate-600/40" },
                            ] as const).map((p) => {
                                const count = getSavedCountByPlatform(p.id);
                                const isActive = activeTab === `saved-${p.id}`;
                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => setActiveTab(`saved-${p.id}`)}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                                            isActive ? p.activeColor : `text-slate-400 ${p.hoverColor}`
                                        }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <span>{p.icon}</span>
                                            {p.label}
                                        </span>
                                        {count > 0 ? (
                                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black border ${isActive ? p.badgeCls : "bg-slate-900 text-slate-500 border-slate-800"}`}>
                                                {count}
                                            </span>
                                        ) : (
                                            <span className="text-[9px] text-slate-700">—</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </nav>
                </div>

                {/* Bottom User Section with Settings Cog */}
                <div className="border-t border-slate-800 pt-4 flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-xs shrink-0">
                            {user.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate">{user.email.split("@")[0]}</p>
                            <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                        </div>
                    </div>
                    
                    {/* Settings Cog Button */}
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="p-2 border border-slate-800 bg-slate-950/50 hover:bg-slate-900 text-slate-400 hover:text-white rounded-xl transition-all"
                        title="ანგარიშის პარამეტრები"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.991l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                {/* Header */}
                <header className="h-20 border-b border-slate-800 bg-slate-950/40 backdrop-blur-xl px-8 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4 min-w-0">
                        {/* Page Title / Section */}
                        <div className="flex flex-col border-r border-slate-800 pr-5 shrink-0">
                            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Workspace</span>
                            <h1 className="text-sm font-extrabold text-white mt-0.5">
                                {activeTab === "generator"  && "გენერატორი"}
                                {activeTab === "dashboard"  && "პანელი"}
                                {activeTab === "calendar"   && "კალენდარი"}
                                {activeTab.startsWith("saved-") && "ბიბლიოთეკა"}
                            </h1>
                        </div>

                        {activeProject && (
                            <div className="flex items-center gap-3 min-w-0 pl-1">
                                {/* Project Logo */}
                                <img
                                    src={activeProject.logo_url}
                                    alt="Logo"
                                    className="w-10 h-10 rounded-xl object-cover border border-slate-800 shadow-md shrink-0 bg-slate-900"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&auto=format&fit=crop&q=80";
                                    }}
                                />
                                {/* Project Details Column */}
                                <div className="flex flex-col min-w-0 leading-tight">
                                    <div className="flex items-center gap-2">
                                        <span className="font-extrabold text-xs text-white truncate max-w-[150px]">
                                            {activeProject.name}
                                        </span>
                                        {activeProject.link && (
                                            <a
                                                href={activeProject.link.startsWith("http") ? activeProject.link : `https://${activeProject.link}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-slate-500 hover:text-indigo-400 transition-colors flex items-center"
                                                title="საიტის გახსნა"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                                </svg>
                                            </a>
                                        )}
                                        <button
                                            onClick={() => openEditModal(activeProject)}
                                            className="px-2 py-0.5 ml-1 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-indigo-500/40 hover:text-indigo-400 text-[10px] font-bold text-slate-400 transition-all flex items-center gap-1 shrink-0"
                                            title="საქმიანობის რედაქტირება"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-2.5 h-2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.83 20.062a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                            </svg>
                                            რედაქტირება
                                        </button>
                                    </div>
                                    
                                    {/* Subtitle / Context description with Custom Hover Tooltip */}
                                    <div className="relative group shrink-0 min-w-0 max-w-[280px] mt-1">
                                        <span className="text-[10px] text-slate-500 italic truncate block cursor-help">
                                            კონტექსტი: {activeProject.description || "აღწერის გარეშე"}
                                        </span>
                                        {/* Hover Tooltip for full text */}
                                        <div className="absolute left-0 top-full mt-2 hidden group-hover:block w-72 p-3 bg-slate-950 border border-slate-800 text-slate-300 rounded-xl shadow-2xl z-50 text-[11px] leading-relaxed normal-case font-normal animate-fade-in">
                                            <p className="font-bold text-white mb-1">საქმიანობის სრული კონტექსტი</p>
                                            <p className="italic text-slate-400 whitespace-pre-line">{activeProject.description || "აღწერის გარეშე"}</p>
                                            <div className="absolute bottom-full left-6 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-slate-950" />
                                            <div className="absolute bottom-full left-6 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-b-[7px] border-b-slate-800 -z-10" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Supabase</span>
                    </div>
                </header>

                {/* Workspace Tabs Content */}
                <div className="flex-1 p-8">
                    
                    {/* 1. Generator Tab */}
                    {activeTab === "generator" && (
                        <>
                            {!activeProject ? (
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
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start h-full">
                                        {/* Left: Input Form */}
                                        <div className="glass-panel rounded-2xl p-6 space-y-6">

                                        {/* ── Calendar target date banner ── */}
                                        {scheduleTargetDate && (
                                            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/8 animate-pulse-once">
                                                <span className="text-emerald-400">📅</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[11px] font-bold text-emerald-300">
                                                        კალენდარში დამატება:
                                                    </p>
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
                                                    <p className="text-[11px] font-bold text-indigo-300">
                                                        განრიგის ჩანაწერის რედაქტირება:
                                                    </p>
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
                                                    onClick={() => {
                                                        setEditingCalendarEvent(null);
                                                        setPrompt("");
                                                        setImagePrompt("");
                                                        setUploadedImage(null);
                                                        setUploadedImageName(null);
                                                    }}
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
                                                    onClick={() => {
                                                        setScheduleTargetDate(null);
                                                        setPrompt("");
                                                        setImagePrompt("");
                                                        setUploadedImage(null);
                                                        setUploadedImageName(null);
                                                    }}
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
                                                    {/* If scheduleTargetDate is set, the main button was used, but we still allow manual scheduling just in case */}
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
                                                    userEmail={user.email}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* 2. Dashboard Tab */}
                    {activeTab === "dashboard" && (
                        <div className="space-y-8 animate-fade-in">
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
                    )}

                    {/* 3. Calendar / Schedule Tab */}
                    {activeTab === "calendar" && (
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
                                        onClick={() => { setPlatform("facebook"); setTone("professional"); setActiveTab("generator"); }}
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
                                onAddEvent={handleCalendarAddEvent}
                                onUpdateEvent={handleCalendarUpdateEvent}
                                onDeleteEvent={handleCalendarDeleteEvent}
                                onNavigateToGenerator={handleNavigateToGenerator}
                                onNavigateToGeneratorForEdit={handleNavigateToGeneratorForEdit}
                                pendingEvent={pendingCalendarEvent}
                                onPendingEventConsumed={() => setPendingCalendarEvent(null)}
                            />
                        </div>
                    )}

                    {/* 4. Platform specific Saved Ads Tabs */}

                    {activeTab.startsWith("saved-") && (() => {
                        const currentPlatformId = activeTab.replace("saved-", "");
                        const PLAT_META: Record<string, { label: string; icon: string; headerBg: string; badge: string; editBtn: string }> = {
                            facebook:  { label: "Facebook",  icon: "🔵", headerBg: "bg-blue-500/8 border-blue-500/20",  badge: "bg-blue-500/15 text-blue-400 border-blue-500/30",  editBtn: "border-blue-700/40 bg-blue-950/30 text-blue-300 hover:bg-blue-900/40" },
                            instagram: { label: "Instagram", icon: "📸", headerBg: "bg-pink-500/8 border-pink-500/20",  badge: "bg-pink-500/15 text-pink-400 border-pink-500/30",  editBtn: "border-pink-700/40 bg-pink-950/30 text-pink-300 hover:bg-pink-900/40" },
                            linkedin:  { label: "LinkedIn",  icon: "💼", headerBg: "bg-teal-500/8 border-teal-500/20",  badge: "bg-teal-500/15 text-teal-400 border-teal-500/30",  editBtn: "border-teal-700/40 bg-teal-950/30 text-teal-300 hover:bg-teal-900/40" },
                            x:         { label: "X (Twitter)",icon: "🐦", headerBg: "bg-slate-700/15 border-slate-600/30", badge: "bg-slate-700/30 text-slate-300 border-slate-600/40", editBtn: "border-slate-600/40 bg-slate-800/30 text-slate-300 hover:bg-slate-700/40" },
                        };
                        const meta = PLAT_META[currentPlatformId] || PLAT_META.facebook;
                        const filteredAds = getFilteredSavedAds();
                        return (
                            <div className="space-y-6">
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
                    })()}
                </div>
            </main>

            {/* Project Creation / Editing Modal Overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white">
                                {editingProject ? "✏️ საქმიანობის რედაქტირება" : "✨ ახალი საქმიანობის შექმნა"}
                            </h3>
                            <button 
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setEditingProject(null);
                                }}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleProjectSubmit} className="space-y-4 text-xs">
                            <div className="space-y-1.5">
                                <label className="block font-semibold text-slate-400">საქმიანობის სახელი *</label>
                                <input
                                    type="text"
                                    required
                                    value={projName}
                                    onChange={(e) => setProjName(e.target.value)}
                                    placeholder="მაგ: ყავის კაფე 'ჯიმი', ტანსაცმლის ხაზი 'Moda'"
                                    className="w-full rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-slate-100 outline-none focus:border-indigo-500/50"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block font-semibold text-slate-400">ვებსაიტის / გვერდის ლინკი</label>
                                <input
                                    type="url"
                                    value={projLink}
                                    onChange={(e) => setProjLink(e.target.value)}
                                    placeholder="https://example.com"
                                    className="w-full rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-slate-100 outline-none focus:border-indigo-500/50"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block font-semibold text-slate-400">ლოგო / სურათი</label>
                                {!projLogoFile ? (
                                    <div
                                        onClick={() => logoFileInputRef.current?.click()}
                                        className="border border-dashed border-slate-700 hover:border-indigo-500/50 rounded-xl p-5 text-center cursor-pointer bg-slate-950/30 hover:bg-indigo-500/[0.03] transition-all group"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-slate-600 group-hover:text-indigo-400 mx-auto mb-2 transition-colors">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                        </svg>
                                        <p className="text-xs text-slate-400 group-hover:text-slate-300 font-semibold transition-colors">დააჭირეთ ლოგოს ასატვირთად</p>
                                        <p className="text-[10px] text-slate-600 mt-1">PNG, JPG, SVG · მაქს. 2MB</p>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                                        <img
                                            src={projLogoFile}
                                            alt="Logo Preview"
                                            className="w-12 h-12 rounded-lg object-cover border border-slate-700 shrink-0"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-bold text-white truncate">{projLogoFileName}</p>
                                            <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block"></span>
                                                ატვირთულია
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleRemoveLogoFile}
                                            className="h-7 w-7 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-all shrink-0 text-xs font-bold"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                )}
                                <input
                                    ref={logoFileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoFileChange}
                                    className="hidden"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block font-semibold text-slate-400">საქმიანობის ტიპის აღწერა *</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={projDesc}
                                    onChange={(e) => setProjDesc(e.target.value)}
                                    placeholder="მაგ: მყუდრო კაფე თბილისში, სადაც გვაქვს საუკეთესო არაბიკა ყავა, დესერტები და უფასო ინტერნეტი."
                                    className="w-full rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-slate-100 outline-none focus:border-indigo-500/50 leading-relaxed"
                                />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setEditingProject(null);
                                    }}
                                    className="flex-1 py-3 border border-slate-800 bg-transparent text-slate-300 font-bold rounded-xl hover:bg-slate-900 transition-colors"
                                >
                                    გაუქმება
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingProj}
                                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/10 transition-colors disabled:opacity-50"
                                >
                                    {isSubmittingProj ? "ინახება..." : editingProject ? "შენახვა" : "შექმნა"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Account Settings Modal */}
            {isSettingsOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                ⚙️ ანგარიშის პარამეტრები
                            </h3>
                            <button 
                                onClick={() => setIsSettingsOpen(false)}
                                className="text-slate-400 hover:text-white transition-colors text-sm"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="border-t border-b border-slate-800/80 py-4 text-left space-y-3.5 text-xs">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-medium">ელ-ფოსტა:</span>
                                <span className="font-bold text-slate-200">{user.email}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-medium">ID ნომერი:</span>
                                <span className="font-mono text-slate-400 select-all truncate max-w-[180px]" title={user.id}>{user.id}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-medium">სესიის სტატუსი:</span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                                    ავტორიზებული
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsSettingsOpen(false)}
                                className="flex-1 py-2.5 border border-slate-800 bg-transparent text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-900 transition-colors"
                            >
                                დახურვა
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex-1 py-2.5 bg-rose-600/90 hover:bg-rose-600 text-white font-bold rounded-xl text-xs transition-colors"
                            >
                                გამოსვლა
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Custom Notification Modal (replaces browser alert) ─── */}
            {notification && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className={`w-full max-w-xs rounded-2xl border p-6 shadow-2xl space-y-4 animate-scale-in ${
                        notification.type === "success"
                            ? "bg-slate-950 border-emerald-800/60"
                            : "bg-slate-950 border-rose-800/60"
                    }`}>
                        {/* Icon */}
                        <div className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                            notification.type === "success"
                                ? "bg-emerald-500/10 border border-emerald-500/20 shadow-emerald-500/10"
                                : "bg-rose-500/10 border border-rose-500/20 shadow-rose-500/10"
                        }`}>
                            {notification.type === "success" ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-7 h-7 text-emerald-400">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-7 h-7 text-rose-400">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                </svg>
                            )}
                        </div>

                        {/* Message */}
                        <div className="text-center space-y-1">
                            <p className={`text-sm font-bold ${
                                notification.type === "success" ? "text-emerald-300" : "text-rose-300"
                            }`}>
                                {notification.type === "success" ? "წარმატებით!" : "შეცდომა"}
                            </p>
                            <p className="text-sm text-slate-300 leading-relaxed">{notification.message}</p>
                        </div>

                        {/* OK Button */}
                        <button
                            onClick={() => setNotification(null)}
                            className={`w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] ${
                                notification.type === "success"
                                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/15"
                                    : "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/15"
                            }`}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

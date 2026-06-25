"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/authStore";
import { useProjectStore, Project } from "../../store/projectStore";
import { generateMockAd, GeneratedAd } from "../../utils/mockGenerator";
import SocialPreview from "../../components/SocialPreview";

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
    const [prompt, setPrompt] = useState("");
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

    // Sidebar platform expanded for history
    const [expandedHistoryPlatform, setExpandedHistoryPlatform] = useState<string | null>(null);

    // Toggle sidebar history for a platform
    const toggleHistoryPlatform = (plat: string) => {
        setExpandedHistoryPlatform(prev => prev === plat ? null : plat);
    };

    // ── Schedule / Calendar State ──
    type ScheduleEntry = { platform: string; tone: string };
    type WeekSchedule = Record<string, ScheduleEntry[]>;

    const DAYS_GEO: { id: string; label: string; short: string }[] = [
        { id: "monday",    label: "ორშაბათი",    short: "ორშ" },
        { id: "tuesday",   label: "სამშაბათი",   short: "სამ" },
        { id: "wednesday", label: "ოთხშაბათი", short: "ოთხ" },
        { id: "thursday",  label: "ხუთშაბათი",  short: "ხუთ" },
        { id: "friday",    label: "პარასკევი",    short: "პარ" },
        { id: "saturday",  label: "შაბათი",    short: "შაბ" },
        { id: "sunday",    label: "კვირა",      short: "კვი" },
    ];

    const PLATFORMS_CFG = [
        { id: "facebook",  label: "Facebook",   icon: "🔵", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
        { id: "instagram", label: "Instagram",  icon: "📸", color: "bg-pink-500/10 text-pink-400 border-pink-500/20" },
        { id: "linkedin",  label: "LinkedIn",   icon: "💼", color: "bg-teal-500/10 text-teal-400 border-teal-500/20" },
        { id: "x",         label: "X",          icon: "🐦", color: "bg-slate-700/20 text-slate-300 border-slate-700/40" },
    ];

    const TONES_CFG = [
        { id: "professional", label: "ოფიციალური" },
        { id: "friendly",     label: "მეგობრული" },
        { id: "funny",        label: "ხუმარა" },
        { id: "bold",         label: "მბზინავი" },
    ];

    const defaultSchedule: WeekSchedule = {
        monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
    };

    const [schedule, setSchedule] = useState<WeekSchedule>(defaultSchedule);
    const [addingDay, setAddingDay] = useState<string | null>(null); // which day's "add" popover is open
    const [newEntryPlatform, setNewEntryPlatform] = useState("facebook");
    const [newEntryTone, setNewEntryTone] = useState("professional");

    // Load schedule from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem("goniflow_schedule");
            if (stored) setSchedule(JSON.parse(stored));
        } catch {}
    }, []);

    // Save schedule to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem("goniflow_schedule", JSON.stringify(schedule));
    }, [schedule]);

    const addScheduleEntry = (day: string) => {
        const entry: ScheduleEntry = { platform: newEntryPlatform, tone: newEntryTone };
        setSchedule(prev => ({ ...prev, [day]: [...(prev[day] || []), entry] }));
        setAddingDay(null);
    };

    const removeScheduleEntry = (day: string, idx: number) => {
        setSchedule(prev => ({
            ...prev,
            [day]: prev[day].filter((_, i) => i !== idx)
        }));
    };

    const totalScheduledPerWeek = Object.values(schedule).reduce((sum, arr) => sum + arr.length, 0);

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

    // Custom Notification Modal
    const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const showNotification = (type: "success" | "error", message: string) => {
        setNotification({ type, message });
    };

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
        if ((!prompt.trim() && !uploadedImage) || !activeProject) return;
        setIsGenerating(true);
        setGeneratedAd(null);
        
        // Mock Vision analysis context injection
        let imageContext = "";
        if (uploadedImageName) {
            imageContext = ` [ატვირთული სურათი: ${uploadedImageName}]`;
        }

        // Context-aware prompt generation: Combine project info + prompt + image name if uploaded
        const combinedContext = `[ბიზნესი: ${activeProject.name}. სფერო/აღწერა: ${activeProject.description}. საიტი: ${activeProject.link}]${imageContext} - კამპანია: ${prompt || "პროდუქტის ზოგადი რეკლამირება"}`;

        setTimeout(() => {
            const result = generateMockAd(combinedContext, platform, tone, uploadedImage || undefined);
            
            // If prompt is empty but image name exists, simulate a vision analysis by tweaking headlines
            if (!prompt.trim() && uploadedImageName) {
                result.text = `🎯 სურათის ანალიზის შედეგი:\n\nატვირთული ფოტოს საფუძველზე შექმნილია პოსტი!\n\n${result.text}`;
                result.headline = `📸 ფოტოდან გაანალიზებული: ${activeProject.name}`;
            }

            setGeneratedAd(result);
            setIsGenerating(false);
        }, 1500);
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
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                            <span className="font-extrabold text-white text-base">G</span>
                        </div>
                        <div>
                            <span className="font-black text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">GoniFlow</span>
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

                        {/* Platform History Submenus */}
                        <div className="space-y-1">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 px-4 mb-2">შენახული პოსტები</span>

                            {([
                                { id: "facebook", label: "Facebook", icon: "🔵", accent: "text-blue-400", accentBg: "bg-blue-500/10", accentBorder: "border-blue-500/20" },
                                { id: "instagram", label: "Instagram", icon: "📸", accent: "text-pink-400", accentBg: "bg-pink-500/10", accentBorder: "border-pink-500/20" },
                                { id: "linkedin", label: "LinkedIn", icon: "💼", accent: "text-teal-400", accentBg: "bg-teal-500/10", accentBorder: "border-teal-500/20" },
                                { id: "x", label: "X (Twitter)", icon: "🐦", accent: "text-slate-200", accentBg: "bg-slate-700/20", accentBorder: "border-slate-700/40" },
                            ] as const).map((p) => {
                                const count = getSavedCountByPlatform(p.id);
                                const isOpen = expandedHistoryPlatform === p.id;
                                const platformAds = savedAds.filter(a => a.platform === p.id);
                                return (
                                    <div key={p.id}>
                                        {/* Platform toggle button */}
                                        <button
                                            onClick={() => toggleHistoryPlatform(p.id)}
                                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                                                isOpen
                                                    ? `${p.accentBg} ${p.accent} border ${p.accentBorder}`
                                                    : "text-slate-400 hover:bg-slate-900/50 hover:text-slate-200"
                                            }`}
                                        >
                                            <span className="flex items-center gap-2">
                                                <span>{p.icon}</span> {p.label}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                {count > 0 && (
                                                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black border ${
                                                        isOpen ? `${p.accentBg} ${p.accent} ${p.accentBorder}` : "bg-slate-950 text-slate-500 border-slate-900"
                                                    }`}>
                                                        {count}
                                                    </span>
                                                )}
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                                </svg>
                                            </span>
                                        </button>

                                        {/* Inline history list */}
                                        {isOpen && (
                                            <div className="ml-3 mt-1 mb-1 space-y-1 border-l border-slate-800 pl-3">
                                                {platformAds.length === 0 ? (
                                                    <div className="py-3 px-2 text-center">
                                                        <p className="text-[10px] text-slate-600 leading-relaxed">ჯერ არ გაქვთ შენახული {p.label}-ის პოსტები</p>
                                                        <button
                                                            onClick={() => { setPlatform(p.id); setActiveTab("generator"); }}
                                                            className="mt-1.5 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                                                        >
                                                            ➕ პოსტის შექმნა
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="max-h-52 overflow-y-auto space-y-1 pr-0.5 scrollbar-thin">
                                                        {platformAds.slice().reverse().map((ad) => (
                                                            <button
                                                                key={ad.id}
                                                                onClick={() => setActiveTab(`saved-${p.id}`)}
                                                                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-900/70 transition-all group"
                                                            >
                                                                <p className="text-[11px] font-semibold text-slate-300 group-hover:text-white truncate leading-tight">
                                                                    {ad.headline || ad.text.split("\n")[0]}
                                                                </p>
                                                                <p className="text-[9px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed group-hover:text-slate-500">
                                                                    {ad.text}
                                                                </p>
                                                                {ad.cta && (
                                                                    <span className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md ${p.accentBg} ${p.accent} border ${p.accentBorder}`}>
                                                                        {ad.cta}
                                                                    </span>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                                {/* View all link */}
                                                {platformAds.length > 0 && (
                                                    <button
                                                        onClick={() => setActiveTab(`saved-${p.id}`)}
                                                        className={`w-full text-center text-[10px] font-bold py-1.5 rounded-lg ${p.accent} hover:bg-slate-900/50 transition-colors`}
                                                    >
                                                        ყველა ({count}) →
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
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
                <header className="h-16 border-b border-slate-800 bg-slate-950/40 backdrop-blur-xl px-8 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold tracking-tight text-white mr-4">
                            {activeTab === "generator"  && "პოსტების გენერატორი"}
                            {activeTab === "dashboard"  && "Dashboard"}
                            {activeTab === "calendar"   && "განრიგი / კალენდარი"}
                            {activeTab.startsWith("saved-") && `შენახული პოსტები: ${activeTab.replace("saved-", "").toUpperCase()}`}
                        </h1>
                        {activeProject && (
                            <span className="text-xs bg-slate-800/80 border border-slate-700 px-3 py-1 rounded-full text-slate-300 font-semibold">
                                {activeProject.name}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-xs text-slate-400 font-medium">Supabase სესია აქტიურია</span>
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
                                        {/* Business context visualization */}
                                        <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-2 text-xs flex items-center justify-between gap-4">
                                            <div className="min-w-0 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <img 
                                                        src={activeProject.logo_url} 
                                                        alt="Project Logo" 
                                                        className="w-5 h-5 rounded object-cover" 
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=50&auto=format&fit=crop&q=80";
                                                        }}
                                                    />
                                                    <span className="font-bold text-white truncate">{activeProject.name}</span>
                                                    {activeProject.link && (
                                                        <span className="text-slate-500 font-mono truncate max-w-[150px]">{activeProject.link}</span>
                                                    )}
                                                </div>
                                                <p className="text-slate-400 italic line-clamp-2">კონტექსტი: {activeProject.description || "აღწერის გარეშე"}</p>
                                            </div>

                                            {/* Edit Button directly on active context bar */}
                                            <button
                                                onClick={() => openEditModal(activeProject)}
                                                className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white text-[11px] font-bold transition-all shrink-0 flex items-center gap-1"
                                                title="პროფილის რედაქტირება"
                                            >
                                                ✏️ რედაქტირება
                                            </button>
                                        </div>

                                        <div>
                                            <h2 className="text-base font-bold text-white mb-1">პოსტის შექმნა</h2>
                                            <p className="text-xs text-slate-400">აღწერეთ კამპანია ან ატვირთეთ პროდუქტის ფოტო ანალიზისთვის.</p>
                                        </div>

                                        {/* Image Upload Area */}
                                        <div className="space-y-2">
                                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">პროდუქტის ფოტო (AI ანალიზი)</label>
                                            
                                            {!uploadedImage ? (
                                                <div 
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="border border-dashed border-slate-800 hover:border-indigo-500/40 rounded-xl p-6 text-center cursor-pointer bg-slate-950/20 hover:bg-indigo-500/[0.02] transition-all group"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-slate-600 group-hover:text-indigo-400 mx-auto mb-2 transition-colors">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                                    </svg>
                                                    <span className="text-xs text-slate-400 group-hover:text-slate-300 font-semibold transition-colors block">დააჭირეთ სურათის ასატვირთად</span>
                                                    <span className="text-[10px] text-slate-500 mt-1 block">AI ავტომატურად გაანალიზებს ფოტოს შინაარსს</span>
                                                </div>
                                            ) : (
                                                <div className="relative rounded-xl border border-slate-800 bg-slate-950/40 p-3 flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <img 
                                                            src={uploadedImage} 
                                                            alt="Uploaded Product" 
                                                            className="w-12 h-12 rounded-lg object-cover border border-slate-800 shrink-0" 
                                                        />
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold text-white truncate">{uploadedImageName}</p>
                                                            <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                                                                <span className="h-1 w-1 rounded-full bg-emerald-400"></span>
                                                                მზად არის ანალიზისთვის
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={handleRemoveImage}
                                                        className="h-8 w-8 rounded-lg border border-slate-850 hover:border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-rose-400 text-xs font-bold transition-all shrink-0 flex items-center justify-center"
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
                                        </div>

                                        {/* Prompt Input */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label htmlFor="ad-prompt" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">კამპანიის იდეა / დამატებითი ტექსტი</label>
                                                {uploadedImage && <span className="text-[10px] text-indigo-400 font-bold">არასავალდებულო (თუ სურათი ატვირთულია)</span>}
                                            </div>
                                            <textarea
                                                id="ad-prompt"
                                                rows={3}
                                                value={prompt}
                                                onChange={(e) => setPrompt(e.target.value)}
                                                placeholder={uploadedImage ? "დატოვეთ ცარიელი AI-ით ფოტოს სრული ანალიზისთვის, ან დაამატეთ დამატებითი დეტალები..." : "მაგ: ორშაბათის აქცია, ყოველი მეორე ყავა უფასოდ ან საახალწლო 20%-იანი ფასდაკლება..."}
                                                className="w-full rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-slate-100 placeholder-slate-500 shadow-inner outline-none transition-all focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 text-sm leading-relaxed"
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

                                        {/* Generate Button */}
                                        <button
                                            onClick={handleGenerate}
                                            disabled={isGenerating || (!prompt.trim() && !uploadedImage)}
                                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                                        >
                                            {isGenerating ? (
                                                <>
                                                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    AI აანალიზებს ფოტოს და კამპანიას...
                                                </>
                                            ) : (
                                                <>
                                                    🚀 პოსტის გენერირება
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {/* Right: Live Preview Panel */}
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">რეალური Live Preview</h2>
                                            {generatedAd && (
                                                <div className="flex gap-2">
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
                                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">კვირის განრიგი</h2>
                                {totalScheduledPerWeek === 0 ? (
                                    <div className="glass-panel rounded-2xl p-8 text-center text-slate-600 space-y-3">
                                        <p className="text-sm font-semibold">განრიგი ჯერ არ არის დაყენებული</p>
                                        <button onClick={() => setActiveTab("calendar")} className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
                                            ➕ განრიგის დაყენება
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-7 gap-2">
                                        {DAYS_GEO.map(day => (
                                            <div key={day.id} className="glass-panel rounded-xl p-2 space-y-1.5">
                                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 text-center">{day.short}</p>
                                                {(schedule[day.id] || []).length === 0 ? (
                                                    <p className="text-[9px] text-slate-700 text-center py-2">—</p>
                                                ) : (
                                                    (schedule[day.id] || []).map((entry, i) => {
                                                        const pcfg = PLATFORMS_CFG.find(p => p.id === entry.platform);
                                                        return (
                                                            <div key={i} className={`text-[9px] font-bold px-1.5 py-1 rounded-lg border text-center ${pcfg?.color || ""}`}>
                                                                {pcfg?.icon} {pcfg?.label}
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        ))}
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
                                            const pcfg = PLATFORMS_CFG.find(p => p.id === ad.platform);
                                            return (
                                                <div key={ad.id} className="glass-panel rounded-2xl p-4 space-y-3">
                                                    <div className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2 py-0.5 rounded-full border ${pcfg?.color || ""}`}>
                                                        {pcfg?.icon} {pcfg?.label}
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
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
                                    დაიგეგმეთ კვირის განრიგი — მიუთითეთ რომელ დღეს რომელ პლატფორმაზე გსურთ პოსტის გენერირება და რა ტონით.
                                    განრიგი ინახება ლოკალურად.
                                </p>
                                {totalScheduledPerWeek > 0 && (
                                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                                        {totalScheduledPerWeek} ჩანაწერი კვირაში
                                    </span>
                                )}
                            </div>

                            {/* 7-day grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
                                {DAYS_GEO.map(day => (
                                    <div key={day.id} className="glass-panel rounded-2xl p-4 space-y-3 relative">
                                        {/* Day header */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black text-white">{day.label}</span>
                                            <button
                                                onClick={() => { setAddingDay(addingDay === day.id ? null : day.id); setNewEntryPlatform("facebook"); setNewEntryTone("professional"); }}
                                                className="h-6 w-6 rounded-lg bg-slate-800 hover:bg-indigo-500/20 hover:text-indigo-400 text-slate-400 flex items-center justify-center transition-all text-sm font-bold"
                                                title="პლატფორმის დამატება"
                                            >
                                                {addingDay === day.id ? "✕" : "+"}
                                            </button>
                                        </div>

                                        {/* Entries */}
                                        <div className="space-y-1.5 min-h-[40px]">
                                            {(schedule[day.id] || []).length === 0 && addingDay !== day.id ? (
                                                <p className="text-[10px] text-slate-700 italic text-center py-2">დასვენება ☕</p>
                                            ) : (
                                                (schedule[day.id] || []).map((entry, idx) => {
                                                    const pcfg = PLATFORMS_CFG.find(p => p.id === entry.platform);
                                                    const tcfg = TONES_CFG.find(t => t.id === entry.tone);
                                                    return (
                                                        <div key={idx} className={`flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-xl border ${pcfg?.color || ""} group`}>
                                                            <span className="text-[10px] font-bold flex items-center gap-1 truncate">
                                                                <span>{pcfg?.icon}</span>
                                                                <span className="truncate">{pcfg?.label}</span>
                                                            </span>
                                                            <div className="flex items-center gap-1 shrink-0">
                                                                <span className="text-[8px] font-bold opacity-60">{tcfg?.label}</span>
                                                                <button
                                                                    onClick={() => removeScheduleEntry(day.id, idx)}
                                                                    className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-300 transition-all text-[10px] font-black leading-none"
                                                                    title="წაშლა"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>

                                        {/* Add entry popover */}
                                        {addingDay === day.id && (
                                            <div className="border-t border-slate-800 pt-3 space-y-2.5">
                                                {/* Platform selector */}
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">პლატფორმა</p>
                                                    <div className="grid grid-cols-2 gap-1">
                                                        {PLATFORMS_CFG.map(p => (
                                                            <button
                                                                key={p.id}
                                                                onClick={() => setNewEntryPlatform(p.id)}
                                                                className={`text-[9px] font-bold px-2 py-1.5 rounded-lg border transition-all flex items-center gap-1 ${
                                                                    newEntryPlatform === p.id
                                                                        ? p.color
                                                                        : "border-slate-800 text-slate-500 hover:text-slate-300"
                                                                }`}
                                                            >
                                                                {p.icon} {p.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                {/* Tone selector */}
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">ტონი</p>
                                                    <div className="grid grid-cols-2 gap-1">
                                                        {TONES_CFG.map(t => (
                                                            <button
                                                                key={t.id}
                                                                onClick={() => setNewEntryTone(t.id)}
                                                                className={`text-[9px] font-bold px-2 py-1.5 rounded-lg border transition-all ${
                                                                    newEntryTone === t.id
                                                                        ? "border-indigo-500 bg-indigo-500/10 text-indigo-300"
                                                                        : "border-slate-800 text-slate-500 hover:text-slate-300"
                                                                }`}
                                                            >
                                                                {t.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => addScheduleEntry(day.id)}
                                                    className="w-full py-2 text-[10px] font-black bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all"
                                                >
                                                    ✓ დამატება
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 4. Platform specific Saved Ads Tabs */}

                    {activeTab.startsWith("saved-") && (
                        <div className="space-y-6">
                            {!activeProject ? (
                                <div className="glass-panel rounded-2xl p-12 text-center text-slate-500 max-w-md mx-auto">
                                    <p className="text-sm font-semibold mb-2">საქმიანობის პროფილი არ არსებობს</p>
                                    <button 
                                        onClick={openCreateModal}
                                        className="text-xs font-bold text-indigo-400 hover:underline"
                                    >
                                        შექმენით საქმიანობა და დაიწყეთ
                                    </button>
                                </div>
                            ) : getFilteredSavedAds().length === 0 ? (
                                <div className="glass-panel rounded-2xl p-12 text-center text-slate-500 flex flex-col items-center gap-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12 text-slate-700">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                                    </svg>
                                    <p className="text-sm font-semibold">ამ პლატფორმაზე ({activeTab.replace("saved-", "").toUpperCase()}) ჯერ არ გაქვთ შენახული პოსტები</p>
                                    <button 
                                        onClick={() => setActiveTab("generator")}
                                        className="mt-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                                    >
                                        დაუბრუნდით გენერატორს და შექმენით პირველი პოსტი
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
                                    {getFilteredSavedAds().map((ad) => (
                                        <div key={ad.id} className="glass-panel rounded-2xl p-4 flex flex-col justify-between space-y-4">
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/10">
                                                        {ad.platform} · {ad.tone}
                                                    </span>
                                                    <button 
                                                        onClick={() => deleteSavedAd(activeProject.id, ad.id)}
                                                        className="text-slate-500 hover:text-rose-400 transition-colors text-xs"
                                                    >
                                                        წაშლა
                                                    </button>
                                                </div>
                                                
                                                {/* Display saved ad image if available */}
                                                {ad.image_url && (
                                                    <img 
                                                        src={ad.image_url} 
                                                        alt="Saved Ad" 
                                                        className="w-full h-32 object-cover rounded-xl border border-slate-800" 
                                                    />
                                                )}

                                                <h3 className="font-bold text-sm text-white line-clamp-1">{ad.headline || "Saved Ad"}</h3>
                                                <p className="text-xs text-slate-300 line-clamp-4 leading-relaxed whitespace-pre-line">{ad.text}</p>
                                                {ad.cta && (
                                                    <p className="text-[10px] text-indigo-400 font-bold">CTA: {ad.cta}</p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(`${ad.text}\n\n${ad.cta}`);
                                                    showNotification("success", "ტექსტი წარმატებით კოპირდა!");
                                                }}
                                                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl border border-slate-800 transition-colors"
                                            >
                                                📋 ტექსტის კოპირება
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
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

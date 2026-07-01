"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "../../store/authStore";
import { useProjectStore, Project } from "../../store/projectStore";
import ProjectModal from "../../components/workspace/ProjectModal";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading: isAuthLoading, isAuthenticated, logout } = useAuthStore();
    const {
        projects,
        activeProject,
        savedAds,
        fetchProjects,
        createProject,
        updateProject,
        deleteProject,
        setActiveProject,
        notification,
        setNotification,
        loadCalendarEvents
    } = useProjectStore();

    const router = useRouter();
    const pathname = usePathname();

    // Modal state for project creation/editing
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);

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
            loadCalendarEvents();
        }
    }, [isAuthenticated, fetchProjects, loadCalendarEvents]);

    const handleLogout = async () => {
        try {
            await logout();
            router.push("/login");
        } catch (err) {
            // Handled by store
        }
    };

    // Open project modal for creation
    const openCreateModal = () => {
        setEditingProject(null);
        setIsModalOpen(true);
    };

    // Open project modal for editing
    const openEditModal = (project: Project) => {
        setEditingProject(project);
        setIsModalOpen(true);
    };

    const handleProjectSubmit = async (data: { name: string; link: string; description: string; logo_url: string }) => {
        try {
            if (editingProject) {
                await updateProject(editingProject.id, data);
                useProjectStore.getState().showNotification("success", "საქმიანობა წარმატებით განახლდა!");
            } else {
                await createProject(data);
                useProjectStore.getState().showNotification("success", "საქმიანობა წარმატებით შეიქმნა!");
            }
            setIsModalOpen(false);
            setEditingProject(null);
        } catch (err) {
            useProjectStore.getState().showNotification("error", "შეცდომა ოპერაციის შესრულებისას. სცადეთ თავიდან.");
            throw err;
        }
    };

    const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm("ნამდვილად გსურთ ამ საქმიანობის პროფილის წაშლა? წაიშლება ყველა შენახული პოსტიც.")) {
            await deleteProject(id);
        }
    };

    const getSavedCountByPlatform = (plat: string) => {
        return savedAds.filter((ad) => ad.platform === plat).length;
    };

    // Determine current section title based on pathname
    let pageTitle = "გენერატორი";
    if (pathname === "/profile/dashboard") {
        pageTitle = "პანელი";
    } else if (pathname === "/profile/calendar") {
        pageTitle = "კალენდარი";
    } else if (pathname.startsWith("/profile/library")) {
        pageTitle = "ბიბლიოთეკა";
    }

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
                        <Link
                            href="/profile/dashboard"
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                pathname === "/profile/dashboard"
                                    ? "bg-violet-600 text-white shadow-lg shadow-violet-600/15"
                                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                            }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                            </svg>
                            Dashboard
                        </Link>

                        {/* Calendar / Schedule */}
                        <Link
                            href="/profile/calendar"
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                pathname === "/profile/calendar"
                                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/15"
                                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                            }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                            </svg>
                            განრიგი
                            {savedAds.length > 0 && (
                                <span className="ml-auto px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    {savedAds.length}
                                </span>
                            )}
                        </Link>

                        {/* Post Generator */}
                        <div>
                            <Link
                                href="/profile/generator"
                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                    pathname === "/profile/generator"
                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/15"
                                        : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                                }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 21l8.982-8.983m-10.43 3.44 1.34-3.58 3.58-1.34-1.34-3.58-3.58 1.34ZM18 13.677 19.22 12.28a.2.2 0 0 0-.28-.28l-1.397 1.397a8.25 8.25 0 1 0-1.954 1.954l1.397-1.397a.2.2 0 0 0-.28-.28L15.32 18H18Z" />
                                </svg>
                                პოსტის შექმნა
                            </Link>
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
                                const isPlatformActive = pathname === `/profile/library/${p.id}`;
                                return (
                                    <Link
                                        key={p.id}
                                        href={`/profile/library/${p.id}`}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                                            isPlatformActive ? p.activeColor : `text-slate-400 ${p.hoverColor}`
                                        }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <span>{p.icon}</span>
                                            {p.label}
                                        </span>
                                        {count > 0 ? (
                                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black border ${isPlatformActive ? p.badgeCls : "bg-slate-900 text-slate-500 border-slate-800"}`}>
                                                {count}
                                            </span>
                                        ) : (
                                            <span className="text-[9px] text-slate-700">—</span>
                                        )}
                                    </Link>
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
                <header className="relative z-30 h-20 border-b border-slate-800 bg-slate-950/40 backdrop-blur-xl px-8 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4 min-w-0">
                        {/* Page Title / Section */}
                        <div className="flex flex-col border-r border-slate-800 pr-5 shrink-0">
                            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Workspace</span>
                            <h1 className="text-sm font-extrabold text-white mt-0.5">
                                {pageTitle}
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
                    {children}
                </div>
            </main>

            {/* Project Creation / Editing Modal Overlay */}
            <ProjectModal
                isOpen={isModalOpen}
                project={editingProject}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingProject(null);
                }}
                onSubmit={handleProjectSubmit}
            />

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

            {/* Custom Notification Modal Overlay */}
            {notification && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className={`w-full max-w-xs rounded-2xl border p-6 shadow-2xl space-y-4 animate-scale-in ${
                        notification.type === "success"
                            ? "bg-slate-950 border-emerald-800/60"
                            : "bg-slate-950 border-rose-800/60"
                    }`}>
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

                        <div className="text-center space-y-1">
                            <p className={`text-sm font-bold ${
                                notification.type === "success" ? "text-emerald-300" : "text-rose-300"
                            }`}>
                                {notification.type === "success" ? "წარმატებით!" : "შეცდომა"}
                            </p>
                            <p className="text-sm text-slate-300 leading-relaxed">{notification.message}</p>
                        </div>

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

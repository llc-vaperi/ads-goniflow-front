"use client";

import React, { useState, useEffect, useRef } from "react";
import { Project } from "../../store/projectStore";

interface ProjectModalProps {
    isOpen: boolean;
    project: Project | null;
    onClose: () => void;
    onSubmit: (data: { name: string; link: string; description: string; logo_url: string }) => Promise<void>;
}

export default function ProjectModal({ isOpen, project, onClose, onSubmit }: ProjectModalProps) {
    const [projName, setProjName] = useState("");
    const [projLink, setProjLink] = useState("");
    const [projDesc, setProjDesc] = useState("");
    const [projLogo, setProjLogo] = useState("");
    const [projLogoFile, setProjLogoFile] = useState<string | null>(null); // base64 preview
    const [projLogoFileName, setProjLogoFileName] = useState<string | null>(null);
    const logoFileInputRef = useRef<HTMLInputElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Sync state when modal opens or active project changes
    useEffect(() => {
        if (isOpen) {
            if (project) {
                setProjName(project.name);
                setProjLink(project.link);
                setProjDesc(project.description);
                setProjLogo(project.logo_url);
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
            } else {
                // Clear state for new project creation
                setProjName("");
                setProjLink("");
                setProjDesc("");
                setProjLogo("");
                setProjLogoFile(null);
                setProjLogoFileName(null);
            }
        }
    }, [isOpen, project]);

    const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProjLogoFileName(file.name);
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setProjLogoFile(base64);
                setProjLogo(base64);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projName.trim() || !projDesc.trim()) return;

        setIsSubmitting(true);
        try {
            await onSubmit({
                name: projName,
                link: projLink,
                description: projDesc,
                logo_url: projLogo || "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&auto=format&fit=crop&q=80"
            });
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">
                        {project ? "✏️ საქმიანობის რედაქტირება" : "✨ ახალი საქმიანობის შექმნა"}
                    </h3>
                    <button 
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
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
                            onClick={onClose}
                            className="flex-1 py-3 border border-slate-800 bg-transparent text-slate-300 font-bold rounded-xl hover:bg-slate-900 transition-colors"
                        >
                            გაუქმება
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/10 transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? "ინახება..." : project ? "შენახვა" : "შექმნა"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

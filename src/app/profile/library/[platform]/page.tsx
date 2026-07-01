"use client";

import React, { use } from "react";
import { useRouter } from "next/navigation";
import { useProjectStore, SavedAd } from "../../../../store/projectStore";
import LibraryTab from "../../../../components/workspace/LibraryTab";

export default function LibraryPage({ params }: { params: Promise<{ platform: string }> }) {
    const router = useRouter();
    const { platform } = use(params);
    const {
        activeProject,
        savedAds,
        deleteSavedAd,
        showNotification,
        setEditorPlatform,
        setEditorTone,
        setEditorPrompt,
        setEditorImagePrompt,
        setEditorUploadedImage,
        setEditorUploadedImageName,
        setEditorGeneratedAd
    } = useProjectStore();

    const handleLoadAdToGenerator = (ad: SavedAd) => {
        setEditorPlatform(ad.platform);
        setEditorTone(ad.tone);
        setEditorPrompt(ad.headline || ad.text.split("\n")[0] || "");
        setEditorImagePrompt("");
        setEditorUploadedImage(ad.image_url && ad.image_url.startsWith("data:") ? ad.image_url : null);
        setEditorUploadedImageName(null);
        setEditorGeneratedAd({
            headline: ad.headline || "",
            text: ad.text,
            cta: ad.cta || "",
            imageUrl: ad.image_url || "",
            hashtags: [],
        });
        router.push("/profile/generator");
    };

    const handleActiveTabChange = (tab: string) => {
        if (tab === "calendar") {
            router.push("/profile/calendar");
        } else if (tab === "generator") {
            router.push("/profile/generator");
        } else if (tab === "dashboard") {
            router.push("/profile/dashboard");
        } else if (tab.startsWith("saved-")) {
            const platformId = tab.replace("saved-", "");
            router.push(`/profile/library/${platformId}`);
        }
    };

    const openCreateModal = () => {
        // Controlled via layout project selector
    };

    return (
        <LibraryTab
            activeTab={`saved-${platform}`}
            activeProject={activeProject}
            savedAds={savedAds}
            deleteSavedAd={deleteSavedAd}
            handleLoadAdToGenerator={handleLoadAdToGenerator}
            showNotification={showNotification}
            openCreateModal={openCreateModal}
            setPlatform={setEditorPlatform}
            setActiveTab={handleActiveTabChange}
        />
    );
}

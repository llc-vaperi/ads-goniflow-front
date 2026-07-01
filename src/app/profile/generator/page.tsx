"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useProjectStore } from "../../../store/projectStore";
import { useAuthStore } from "../../../store/authStore";
import GeneratorTab from "../../../components/workspace/GeneratorTab";

export default function GeneratorPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const {
        activeProject,
        saveAd,
        editorPrompt,
        setEditorPrompt,
        editorImagePrompt,
        setEditorImagePrompt,
        editorPlatform,
        setEditorPlatform,
        editorTone,
        setEditorTone,
        editorUploadedImage,
        setEditorUploadedImage,
        editorUploadedImageName,
        setEditorUploadedImageName,
        editorGeneratedAd,
        setEditorGeneratedAd,
        scheduleTargetDate,
        setScheduleTargetDate,
        editingCalendarEvent,
        setEditingCalendarEvent,
        addCalendarEvent,
        updateCalendarEvent,
        setPendingCalendarEvent,
        showNotification
    } = useProjectStore();

    if (!user) return null;

    const openCreateModal = () => {
        // Handled via layout or state trigger, we can search if there's any trigger needed
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

    return (
        <GeneratorTab
            activeProject={activeProject}
            openCreateModal={openCreateModal}
            userEmail={user.email}
            saveAd={saveAd}
            showNotification={showNotification}
            setActiveTab={handleActiveTabChange}
            prompt={editorPrompt}
            setPrompt={setEditorPrompt}
            imagePrompt={editorImagePrompt}
            setImagePrompt={setEditorImagePrompt}
            platform={editorPlatform}
            setPlatform={setEditorPlatform}
            tone={editorTone}
            setTone={setEditorTone}
            uploadedImage={editorUploadedImage}
            setUploadedImage={setEditorUploadedImage}
            uploadedImageName={editorUploadedImageName}
            setUploadedImageName={setEditorUploadedImageName}
            generatedAd={editorGeneratedAd}
            setGeneratedAd={setEditorGeneratedAd}
            scheduleTargetDate={scheduleTargetDate}
            setScheduleTargetDate={setScheduleTargetDate}
            editingCalendarEvent={editingCalendarEvent}
            setEditingCalendarEvent={setEditingCalendarEvent}
            handleCalendarAddEvent={addCalendarEvent}
            handleCalendarUpdateEvent={updateCalendarEvent}
            setPendingCalendarEvent={setPendingCalendarEvent}
        />
    );
}

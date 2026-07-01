"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useProjectStore } from "../../../store/projectStore";
import DashboardTab from "../../../components/workspace/DashboardTab";

export default function DashboardPage() {
    const router = useRouter();
    const { savedAds, calendarEvents } = useProjectStore();

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
        <DashboardTab
            savedAds={savedAds}
            calendarEvents={calendarEvents}
            setActiveTab={handleActiveTabChange}
        />
    );
}

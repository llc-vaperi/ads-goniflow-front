import { create } from "zustand";
import { apiFetch } from "../utils/api";

export interface Project {
  id: string;
  name: string;
  link: string;
  description: string;
  logo_url: string;
  created_at?: string;
}

export interface SavedAd {
  id: string;
  project_id: string;
  platform: string;
  tone: string;
  headline?: string;
  text: string;
  cta?: string;
  image_url?: string;
  created_at?: string;
}

interface ProjectState {
  projects: Project[];
  activeProject: Project | null;
  savedAds: SavedAd[];
  isLoading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  createProject: (project: Omit<Project, "id">) => Promise<void>;
  updateProject: (id: string, project: Omit<Project, "id">) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setActiveProject: (project: Project | null) => void;
  fetchSavedAds: (projectId: string) => Promise<void>;
  saveAd: (projectId: string, ad: Omit<SavedAd, "id" | "project_id">) => Promise<void>;
  deleteSavedAd: (projectId: string, adId: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  activeProject: null,
  savedAds: [],
  isLoading: false,
  error: null,


  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    const isDevSession = typeof window !== "undefined" && localStorage.getItem("dev-session") === "true";

    try {
      if (isDevSession) {
        // Dev bypass fallback using localStorage
        const localProjects = localStorage.getItem("dev-projects");
        const projectsList = localProjects ? JSON.parse(localProjects) : [];
        set({ projects: projectsList, isLoading: false });
        if (projectsList.length > 0 && !get().activeProject) {
          get().setActiveProject(projectsList[0]);
        }
        return;
      }

      const res = await apiFetch("/projects");
      set({ projects: res.data || [], isLoading: false });
      
      // Auto select first project
      if (res.data && res.data.length > 0 && !get().activeProject) {
        get().setActiveProject(res.data[0]);
      }
    } catch (err: any) {
      // Graceful fallback if tables do not exist in DB
      console.warn("DB projects error, falling back to local memory:", err.message);
      const localProjects = typeof window !== "undefined" ? localStorage.getItem("dev-projects") : null;
      const projectsList = localProjects ? JSON.parse(localProjects) : [];
      set({ projects: projectsList, isLoading: false });
      if (projectsList.length > 0 && !get().activeProject) {
        get().setActiveProject(projectsList[0]);
      }
    }
  },

  createProject: async (projData) => {
    set({ isLoading: true, error: null });
    const isDevSession = typeof window !== "undefined" && localStorage.getItem("dev-session") === "true";

    try {
      if (isDevSession) {
        const newProj: Project = {
          id: `local-proj-${Date.now()}`,
          ...projData
        };
        const updated = [newProj, ...get().projects];
        localStorage.setItem("dev-projects", JSON.stringify(updated));
        set({ projects: updated, activeProject: newProj, isLoading: false });
        get().fetchSavedAds(newProj.id);
        return;
      }

      const res = await apiFetch("/projects", {
        method: "POST",
        body: JSON.stringify(projData)
      });
      const updated = [res.data, ...get().projects];
      set({ projects: updated, activeProject: res.data, isLoading: false });
      get().fetchSavedAds(res.data.id);
    } catch (err: any) {
      console.warn("DB create project failed, falling back to local memory:", err.message);
      const newProj: Project = {
        id: `local-proj-${Date.now()}`,
        ...projData
      };
      const updated = [newProj, ...get().projects];
      localStorage.setItem("dev-projects", JSON.stringify(updated));
      set({ projects: updated, activeProject: newProj, isLoading: false });
      get().fetchSavedAds(newProj.id);
    }
  },

  updateProject: async (id, projData) => {
    set({ isLoading: true, error: null });
    const isDevSession = typeof window !== "undefined" && localStorage.getItem("dev-session") === "true";
    const isLocalProject = id.startsWith("local-");

    try {
      if (isDevSession || isLocalProject) {
        const updated = get().projects.map((p) => {
          if (p.id === id) {
            return { ...p, ...projData };
          }
          return p;
        });
        localStorage.setItem("dev-projects", JSON.stringify(updated));
        
        const updatedProj = updated.find((p) => p.id === id) || null;
        set({ 
          projects: updated, 
          activeProject: get().activeProject?.id === id ? updatedProj : get().activeProject,
          isLoading: false 
        });
        return;
      }

      const res = await apiFetch(`/projects/${id}`, {
        method: "PUT",
        body: JSON.stringify(projData)
      });
      const updated = get().projects.map((p) => (p.id === id ? res.data : p));
      set({ 
        projects: updated, 
        activeProject: get().activeProject?.id === id ? res.data : get().activeProject,
        isLoading: false 
      });
    } catch (err: any) {
      console.warn("DB update project failed, falling back to local memory:", err.message);
      const updated = get().projects.map((p) => {
        if (p.id === id) {
          return { ...p, ...projData };
        }
        return p;
      });
      localStorage.setItem("dev-projects", JSON.stringify(updated));
      const updatedProj = updated.find((p) => p.id === id) || null;
      set({ 
        projects: updated, 
        activeProject: get().activeProject?.id === id ? updatedProj : get().activeProject,
        isLoading: false 
      });
    }
  },

  deleteProject: async (id) => {

    set({ isLoading: true, error: null });
    const isDevSession = typeof window !== "undefined" && localStorage.getItem("dev-session") === "true";

    try {
      if (isDevSession || id.startsWith("local-")) {
        const updated = get().projects.filter((p) => p.id !== id);
        localStorage.setItem("dev-projects", JSON.stringify(updated));
        set({ 
          projects: updated, 
          activeProject: updated.length > 0 ? updated[0] : null,
          isLoading: false 
        });
        if (updated.length > 0) {
          get().fetchSavedAds(updated[0].id);
        } else {
          set({ savedAds: [] });
        }
        return;
      }

      await apiFetch(`/projects/${id}`, { method: "DELETE" });
      const updated = get().projects.filter((p) => p.id !== id);
      set({ 
        projects: updated, 
        activeProject: updated.length > 0 ? updated[0] : null,
        isLoading: false 
      });
      if (updated.length > 0) {
        get().fetchSavedAds(updated[0].id);
      } else {
        set({ savedAds: [] });
      }
    } catch (err: any) {
      const updated = get().projects.filter((p) => p.id !== id);
      localStorage.setItem("dev-projects", JSON.stringify(updated));
      set({ 
        projects: updated, 
        activeProject: updated.length > 0 ? updated[0] : null,
        isLoading: false 
      });
      if (updated.length > 0) {
        get().fetchSavedAds(updated[0].id);
      } else {
        set({ savedAds: [] });
      }
    }
  },

  setActiveProject: (project) => {
    set({ activeProject: project });
    if (project) {
      get().fetchSavedAds(project.id);
    } else {
      set({ savedAds: [] });
    }
  },

  fetchSavedAds: async (projectId) => {
    set({ isLoading: true, error: null });
    const isDevSession = typeof window !== "undefined" && localStorage.getItem("dev-session") === "true";
    const isLocalProject = projectId.startsWith("local-");

    try {
      if (isDevSession || isLocalProject) {
        const localAds = localStorage.getItem(`dev-ads-${projectId}`);
        set({ savedAds: localAds ? JSON.parse(localAds) : [], isLoading: false });
        return;
      }

      const res = await apiFetch(`/projects/${projectId}/ads`);
      set({ savedAds: res.data || [], isLoading: false });
    } catch (err: any) {
      console.warn("DB fetch saved ads error, falling back to local memory:", err.message);
      const localAds = typeof window !== "undefined" ? localStorage.getItem(`dev-ads-${projectId}`) : null;
      set({ savedAds: localAds ? JSON.parse(localAds) : [], isLoading: false });
    }
  },

  saveAd: async (projectId, adData) => {
    set({ isLoading: true, error: null });
    const isDevSession = typeof window !== "undefined" && localStorage.getItem("dev-session") === "true";
    const isLocalProject = projectId.startsWith("local-");

    try {
      if (isDevSession || isLocalProject) {
        const newAd: SavedAd = {
          id: `local-ad-${Date.now()}`,
          project_id: projectId,
          ...adData
        };
        const updated = [newAd, ...get().savedAds];
        localStorage.setItem(`dev-ads-${projectId}`, JSON.stringify(updated));
        set({ savedAds: updated, isLoading: false });
        return;
      }

      const res = await apiFetch(`/projects/${projectId}/ads`, {
        method: "POST",
        body: JSON.stringify(adData)
      });
      const updated = [res.data, ...get().savedAds];
      set({ savedAds: updated, isLoading: false });
    } catch (err: any) {
      console.warn("DB save ad failed, falling back to local memory:", err.message);
      const newAd: SavedAd = {
        id: `local-ad-${Date.now()}`,
        project_id: projectId,
        ...adData
      };
      const updated = [newAd, ...get().savedAds];
      localStorage.setItem(`dev-ads-${projectId}`, JSON.stringify(updated));
      set({ savedAds: updated, isLoading: false });
    }
  },

  deleteSavedAd: async (projectId, adId) => {
    set({ isLoading: true, error: null });
    const isDevSession = typeof window !== "undefined" && localStorage.getItem("dev-session") === "true";
    const isLocalAd = adId.startsWith("local-");

    try {
      if (isDevSession || isLocalAd) {
        const updated = get().savedAds.filter((ad) => ad.id !== adId);
        localStorage.setItem(`dev-ads-${projectId}`, JSON.stringify(updated));
        set({ savedAds: updated, isLoading: false });
        return;
      }

      await apiFetch(`/projects/${projectId}/ads/${adId}`, { method: "DELETE" });
      const updated = get().savedAds.filter((ad) => ad.id !== adId);
      set({ savedAds: updated, isLoading: false });
    } catch (err: any) {
      const updated = get().savedAds.filter((ad) => ad.id !== adId);
      localStorage.setItem(`dev-ads-${projectId}`, JSON.stringify(updated));
      set({ savedAds: updated, isLoading: false });
    }
  }
}));

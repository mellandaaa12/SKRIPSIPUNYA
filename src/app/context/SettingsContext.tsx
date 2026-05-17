import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface NotificationSettings {
  newTask: boolean;
  projectUpdate: boolean;
  forumReply: boolean;
  weeklyReport: boolean;
}

interface PreferenceSettings {
  darkMode: boolean;
  language: "id" | "en";
  soundEffects: boolean;
  autoSave: boolean;
}

interface PrivacySettings {
  profileVisibility: "public" | "private";
  showOnlineStatus: boolean;
  allowMessages: boolean;
}

interface SettingsContextType {
  notifications: NotificationSettings;
  preferences: PreferenceSettings;
  privacy: PrivacySettings;
  updateNotifications: (settings: Partial<NotificationSettings>) => void;
  updatePreferences: (settings: Partial<PreferenceSettings>) => void;
  updatePrivacy: (settings: Partial<PrivacySettings>) => void;
}

const defaultSettings: SettingsContextType = {
  notifications: {
    newTask: true,
    projectUpdate: true,
    forumReply: false,
    weeklyReport: true,
  },
  preferences: {
    darkMode: false,
    language: "id",
    soundEffects: true,
    autoSave: true,
  },
  privacy: {
    profileVisibility: "public",
    showOnlineStatus: true,
    allowMessages: true,
  },
  updateNotifications: () => {},
  updatePreferences: () => {},
  updatePrivacy: () => {},
};

const SettingsContext = createContext<SettingsContextType>(defaultSettings);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem("notifications");
    return saved ? JSON.parse(saved) : defaultSettings.notifications;
  });

  const [preferences, setPreferences] = useState<PreferenceSettings>(() => {
    const saved = localStorage.getItem("preferences");
    return saved ? JSON.parse(saved) : defaultSettings.preferences;
  });

  const [privacy, setPrivacy] = useState<PrivacySettings>(() => {
    const saved = localStorage.getItem("privacy");
    return saved ? JSON.parse(saved) : defaultSettings.privacy;
  });

  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem("preferences", JSON.stringify(preferences));
    // Apply dark mode
    if (preferences.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [preferences]);

  useEffect(() => {
    localStorage.setItem("privacy", JSON.stringify(privacy));
  }, [privacy]);

  const updateNotifications = (settings: Partial<NotificationSettings>) => {
    setNotifications((prev) => ({ ...prev, ...settings }));
  };

  const updatePreferences = (settings: Partial<PreferenceSettings>) => {
    setPreferences((prev) => ({ ...prev, ...settings }));
  };

  const updatePrivacy = (settings: Partial<PrivacySettings>) => {
    setPrivacy((prev) => ({ ...prev, ...settings }));
  };

  return (
    <SettingsContext.Provider
      value={{
        notifications,
        preferences,
        privacy,
        updateNotifications,
        updatePreferences,
        updatePrivacy,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

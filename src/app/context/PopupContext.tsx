import React, { createContext, useContext, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, HelpCircle } from "lucide-react";

interface PopupConfig {
  type: 'alert' | 'confirm' | 'prompt';
  title?: string;
  message: string;
  defaultValue?: string;
  placeholder?: string;
  severity?: 'success' | 'error' | 'warning' | 'info';
  resolve: (value: any) => void;
}

interface PopupContextType {
  alert: (message: string, severity?: 'success' | 'error' | 'warning' | 'info', title?: string) => Promise<void>;
  confirm: (message: string, severity?: 'success' | 'error' | 'warning' | 'info', title?: string) => Promise<boolean>;
  prompt: (message: string, defaultValue?: string, placeholder?: string, title?: string) => Promise<string | null>;
}

const PopupContext = createContext<PopupContextType | undefined>(undefined);

export const PopupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [popup, setPopup] = useState<PopupConfig | null>(null);
  const [inputValue, setInputValue] = useState("");

  const alert = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'info', title?: string): Promise<void> => {
    return new Promise((resolve) => {
      setPopup({
        type: 'alert',
        title: title || (severity === 'success' ? 'Sukses' : severity === 'error' ? 'Gagal' : severity === 'warning' ? 'Peringatan' : 'Informasi'),
        message,
        severity,
        resolve: () => {
          setPopup(null);
          resolve();
        }
      });
    });
  };

  const confirm = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'warning', title?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setPopup({
        type: 'confirm',
        title: title || 'Konfirmasi',
        message,
        severity,
        resolve: (res: boolean) => {
          setPopup(null);
          resolve(res);
        }
      });
    });
  };

  const prompt = (message: string, defaultValue: string = "", placeholder: string = "", title?: string): Promise<string | null> => {
    return new Promise((resolve) => {
      setInputValue(defaultValue);
      setPopup({
        type: 'prompt',
        title: title || 'Masukan Data',
        message,
        defaultValue,
        placeholder,
        resolve: (res: string | null) => {
          setPopup(null);
          resolve(res);
        }
      });
    });
  };

  const handleClose = (value: any) => {
    if (popup) {
      popup.resolve(value);
    }
  };

  const contextValue = React.useMemo(() => ({ alert, confirm, prompt }), []);

  React.useEffect(() => {
    registerGlobalPopup(contextValue);
  }, [contextValue]);

  // Severity style helper
  const getSeverityStyles = (severity?: string) => {
    switch (severity) {
      case 'success':
        return {
          icon: <CheckCircle2 className="w-12 h-12 text-[#10B981]" />,
          bg: 'bg-[#D1FAE5]/50 border-[#10B981]/25 dark:bg-emerald-950/30 dark:border-emerald-800/30',
          btnBg: 'bg-gradient-to-r from-[#10B981] to-[#34D399] shadow-lg shadow-emerald-100 dark:shadow-none hover:opacity-95',
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-12 h-12 text-[#EF4444]" />,
          bg: 'bg-[#FEE2E2]/50 border-[#EF4444]/25 dark:bg-red-950/30 dark:border-red-800/30',
          btnBg: 'bg-gradient-to-r from-[#EF4444] to-[#F87171] shadow-lg shadow-red-100 dark:shadow-none hover:opacity-95',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-12 h-12 text-[#F59E0B]" />,
          bg: 'bg-[#FEF3C7]/50 border-[#F59E0B]/25 dark:bg-amber-950/30 dark:border-amber-800/30',
          btnBg: 'bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] shadow-lg shadow-amber-100 dark:shadow-none hover:opacity-95',
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-12 h-12 text-[#0077B6]" />,
          bg: 'bg-[#CAF0F8]/50 border-[#0077B6]/25 dark:bg-blue-950/30 dark:border-blue-800/30',
          btnBg: 'bg-gradient-to-r from-[#0077B6] to-[#00B4D8] shadow-lg shadow-blue-100 dark:shadow-none hover:opacity-95',
        };
    }
  };

  const styles = popup ? getSeverityStyles(popup.severity) : null;

  return (
    <PopupContext.Provider value={contextValue}>
      {children}
      <AnimatePresence>
        {popup && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop with blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => popup.type === 'alert' && handleClose(null)}
            />

            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl overflow-hidden flex flex-col items-center text-center"
            >
              {/* Outer Glow Decorator based on severity */}
              {popup.type !== 'prompt' && styles && (
                <div className={`w-20 h-20 rounded-3xl border flex items-center justify-center mb-5 ${styles.bg}`}>
                  {styles.icon}
                </div>
              )}

              {popup.type === 'prompt' && (
                <div className="w-20 h-20 rounded-3xl border flex items-center justify-center mb-5 bg-[#CAF0F8]/50 border-[#0077B6]/25 dark:bg-blue-950/30 dark:border-blue-800/30">
                  <HelpCircle className="w-12 h-12 text-[#0077B6]" />
                </div>
              )}

              {/* Title & Message */}
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                {popup.title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed whitespace-pre-wrap">
                {popup.message}
              </p>

              {/* Input for Prompt */}
              {popup.type === 'prompt' && (
                <div className="w-full mb-6">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={popup.placeholder || "Ketik di sini..."}
                    className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#0077B6]/20 outline-none transition-all text-sm text-center font-medium"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleClose(inputValue);
                    }}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 w-full justify-center">
                {popup.type === 'alert' && (
                  <button
                    onClick={() => handleClose(null)}
                    className={`px-8 py-3.5 rounded-full font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] min-w-[120px] ${styles?.btnBg}`}
                  >
                    OK
                  </button>
                )}

                {popup.type === 'confirm' && (
                  <>
                    <button
                      onClick={() => handleClose(false)}
                      className="flex-1 py-3.5 rounded-full font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      onClick={() => handleClose(true)}
                      className={`flex-1 py-3.5 rounded-full font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${styles?.btnBg}`}
                    >
                      Ya
                    </button>
                  </>
                )}

                {popup.type === 'prompt' && (
                  <>
                    <button
                      onClick={() => handleClose(null)}
                      className="flex-1 py-3.5 rounded-full font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      onClick={() => handleClose(inputValue)}
                      className="flex-1 py-3.5 rounded-full font-bold text-white shadow-lg bg-gradient-to-r from-[#0077B6] to-[#00B4D8] shadow-blue-100 dark:shadow-none hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      Kirim
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PopupContext.Provider>
  );
};

export const usePopup = () => {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error("usePopup must be used within a PopupProvider");
  }
  return context;
};

let globalPopupInstance: PopupContextType | null = null;

export const registerGlobalPopup = (instance: PopupContextType) => {
  globalPopupInstance = instance;
};

// Global exportable object mimicking alert(), confirm(), prompt() as async/await functions
export const customPopup = {
  alert: async (message: string, severity?: 'success' | 'error' | 'warning' | 'info', title?: string): Promise<void> => {
    if (globalPopupInstance) {
      return globalPopupInstance.alert(message, severity, title);
    }
    // Fallback to window alert if provider is not mounted yet
    window.alert(message);
  },
  confirm: async (message: string, severity?: 'success' | 'error' | 'warning' | 'info', title?: string): Promise<boolean> => {
    if (globalPopupInstance) {
      return globalPopupInstance.confirm(message, severity, title);
    }
    // Fallback to window confirm
    return window.confirm(message);
  },
  prompt: async (message: string, defaultValue?: string, placeholder?: string, title?: string): Promise<string | null> => {
    if (globalPopupInstance) {
      return globalPopupInstance.prompt(message, defaultValue, placeholder, title);
    }
    // Fallback to window prompt
    return window.prompt(message, defaultValue);
  }
};

import { useTheme } from "../context/ThemeContext";
import { Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="
        relative w-10 h-10 rounded-full flex items-center justify-center
        border transition-colors duration-300
        bg-[var(--bg-secondary)]
        border-[var(--border)]
        hover:border-[var(--accent-primary)]
        focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]
        shadow-lg pointer-events-auto
      "
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="sun"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0,   opacity: 1 }}
            exit={{   rotate:  90,  opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute flex items-center justify-center"
          >
            <Sun size={20} className="text-amber-400" />
          </motion.span>
        ) : (
          <motion.span
            key="moon"
            initial={{ rotate: 90,  opacity: 0 }}
            animate={{ rotate: 0,   opacity: 1 }}
            exit={{   rotate: -90,  opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute flex items-center justify-center"
          >
            <Moon size={20} className="text-[var(--text-secondary)]" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

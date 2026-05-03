import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function BottomSheet({ children, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggleExpand = () => setExpanded(!expanded);

  return (
    <motion.div 
      className="absolute bottom-0 inset-x-0 bottom-sheet z-[100] flex flex-col"
      animate={{ 
        height: expanded ? "85vh" : "45vh" 
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{
        borderTop: "1px solid var(--border)",
        background: "var(--bg-secondary)",
        boxShadow: "var(--shadow-sheet)"
      }}
    >
      {/* Draggable Handle Area */}
      <div 
        className="w-full pt-4 pb-2 flex justify-center cursor-ns-resize shrink-0"
        onClick={toggleExpand}
      >
        <div className="bottom-sheet__handle" />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-20">
        {children}
      </div>
    </motion.div>
  );
}

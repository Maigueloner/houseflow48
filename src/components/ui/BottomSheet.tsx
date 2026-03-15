"use client";

import React, { useEffect, useState } from "react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export function BottomSheet({ isOpen, onClose, children, title }: BottomSheetProps) {
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      document.body.style.overflow = "hidden";
    } else {
      setTimeout(() => setIsRendered(false), 300); // match transition duration
      document.body.style.overflow = "";
    }
  }, [isOpen]);

  if (!isRendered) return null;

  return (
    <>
      <div 
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`} 
        onClick={onClose} 
      />
      <div 
        className={`fixed inset-x-0 bottom-0 z-50 flex flex-col pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))] mt-[env(safe-area-inset-top)] rounded-t-[10px] bg-background border border-border shadow-lg transition-transform duration-300 ${isOpen ? "translate-y-0" : "translate-y-full"}`}
      >
        <div className="flex h-14 items-center justify-between px-4 border-b border-border">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-full p-2 bg-muted hover:bg-muted/80 text-muted-foreground transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pt-4 max-h-[calc(100vh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-4rem)]">
          {children}
        </div>
      </div>
    </>
  );
}

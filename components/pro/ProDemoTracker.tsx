"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

/**
 * Registra l'apertura della demo /pro. Non renderizza niente.
 *
 * Serve a una domanda pratica: dei nutrizionisti a cui mandi il link, quanti
 * lo aprono davvero? È la differenza tra "mi hanno detto di sì per cortesia"
 * e "sono interessati", e la scopri solo misurandola.
 */
export function ProDemoTracker() {
  useEffect(() => {
    track("pro_demo_opened");
  }, []);

  return null;
}

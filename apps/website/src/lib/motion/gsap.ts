"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register the ScrollTrigger plugin once. Every motion component imports gsap
// from here so the plugin is guaranteed to be registered before it is used.
//
// register runs a one-time 100vh measurement that appends and removes a probe
// node. In some dev and hot-reload states that removeChild throws a benign
// NotFoundError. Without a guard that throw escapes module evaluation and takes
// down every importer, blanking the page. The plugin is still registered, so we
// swallow the measurement error and carry on.
if (typeof window !== "undefined") {
  try {
    gsap.registerPlugin(ScrollTrigger);
    // Skip the refresh that fires when mobile browser bars show or hide, which
    // is where the 100vh probe churns the most.
    ScrollTrigger.config({ ignoreMobileResize: true });
  } catch {
    // 100vh measurement failed; ScrollTrigger is registered and usable.
  }
}

export { gsap, ScrollTrigger };

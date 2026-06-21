import { driver } from "driver.js";
import "driver.js/dist/driver.css";

// First-run product tour. Targets stable ids the dashboard sets on the status
// panel, the sidebar, and the account cluster.

const SEEN_KEY = "solva.tour.seen";

export function hasSeenTour(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function markSeen(): void {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    // No-op.
  }
}

export function startTour(): void {
  const tour = driver({
    showProgress: true,
    popoverClass: "solva-tour",
    nextBtnText: "Next",
    prevBtnText: "Back",
    doneBtnText: "Done",
    steps: [
      {
        element: "#tour-status",
        popover: {
          title: "Your live solvency",
          description:
            "Reserves against liabilities, with the latest proof verified on Stellar. Run a cycle to publish a fresh one.",
        },
      },
      {
        element: "#tour-nav",
        popover: {
          title: "The console",
          description:
            "Connect reserve sources, review the audit log, and manage your institution. You only see what your role allows.",
        },
      },
      {
        element: "#tour-account",
        popover: {
          title: "Your institution",
          description: "Your role and sign-out live here. Roles control what each member can do.",
        },
      },
    ],
    onDestroyed: () => markSeen(),
  });
  tour.drive();
}

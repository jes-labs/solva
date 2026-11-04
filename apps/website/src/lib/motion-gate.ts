const MOTION_GATE_CLASS = "motion";
const MOTION_READY_FLAG = "__solvaMotionReady";

export const MOTION_GATE_SCRIPT = `(function(){var d=document.documentElement;if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;d.classList.add('${MOTION_GATE_CLASS}');setTimeout(function(){if(!window.${MOTION_READY_FLAG})d.classList.remove('${MOTION_GATE_CLASS}')},2500)})()`;

export function markMotionReady(): void {
  Reflect.set(window, MOTION_READY_FLAG, true);
}

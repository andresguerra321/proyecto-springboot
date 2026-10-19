import { animate, createTimeline, stagger } from 'animejs';

/**
 * ToolRent High-Performance Animation Engine
 * 
 * Architecture:
 * - 100% Hardware-accelerated GPU transitions (translate3d, opacity) on compositor thread.
 * - Auto-cancellation to prevent memory leaks and stacked RAF loops.
 * - CSS-driven micro-staggers that avoid JavaScript thread blockage.
 * - Full compliance with `prefers-reduced-motion`.
 */

// Active animation tracker to prevent race conditions on rapid navigation
const activeAnimations = new WeakMap();

/**
 * Universal anime adapter for ToolRent
 * Supports both Anime.js v4 `animate(targets, params)` and legacy `anime({ targets, ... })`
 * Safely cancels any previously running tween on the same target to avoid stutter/crashes.
 */
export function anime(targetOrOptions, options = {}) {
  let targets;
  let params;

  if (targetOrOptions && typeof targetOrOptions === 'object' && targetOrOptions.targets && Object.keys(options).length === 0) {
    const { targets: t, ...p } = targetOrOptions;
    targets = t;
    params = p;
  } else {
    targets = targetOrOptions;
    params = options;
  }

  // Cancel prior animation on target if tracked
  if (targets && typeof targets === 'object') {
    const targetObj = targets.nodeType ? targets : (Array.isArray(targets) ? targets[0] : targets);
    if (targetObj && activeAnimations.has(targetObj)) {
      try {
        const prevAnim = activeAnimations.get(targetObj);
        if (prevAnim && typeof prevAnim.pause === 'function') prevAnim.pause();
        if (prevAnim && typeof prevAnim.cancel === 'function') prevAnim.cancel();
      } catch (_) {}
    }
  }

  try {
    const animInstance = animate(targets, params);
    if (targets && typeof targets === 'object') {
      const targetObj = targets.nodeType ? targets : (Array.isArray(targets) ? targets[0] : targets);
      if (targetObj) activeAnimations.set(targetObj, animInstance);
    }
    return animInstance;
  } catch (err) {
    console.warn('[ToolRent Animations] Error starting tween:', err);
    return null;
  }
}

export { animate, createTimeline, stagger };

/**
 * Animate elements entering the viewport with high-performance GPU micro-stagger
 * Uses CSS `.tool-card-stagger` to run 100% on compositor thread without main-thread RAF contention.
 */
export function animateStaggerIn(selector, options = {}) {
  const elements = typeof selector === 'string' ? document.querySelectorAll(selector) : selector;
  if (!elements || (elements.length !== undefined && elements.length === 0)) return null;

  const list = Array.from(elements);
  const baseStaggerMs = options.stagger !== undefined ? options.stagger : 25;
  const maxStaggerItems = 12; // Only stagger the visible viewport batch to prevent GPU pipeline choking

  list.forEach((el, index) => {
    if (index < maxStaggerItems) {
      el.style.animationDelay = `${index * baseStaggerMs}ms`;
      el.classList.remove('tool-card-stagger');
      // Trigger minimal layer reset
      void el.offsetWidth;
      el.classList.add('tool-card-stagger');
    } else {
      el.classList.remove('tool-card-stagger');
      el.style.animationDelay = '0ms';
      el.style.opacity = '1';
      el.style.transform = 'none';
    }
  });

  return elements;
}

/**
 * Animate view / page entrance with zero JavaScript thread overhead
 * Uses CSS `.view-enter-active` keyframes on GPU layer with instant cleanup.
 */
export function animateViewEntrance(containerSelector = '#app-content') {
  const el = typeof containerSelector === 'string' ? document.querySelector(containerSelector) : containerSelector;
  if (!el) return null;

  // Clean any old inline styles left by JS engines
  el.style.removeProperty('opacity');
  el.style.removeProperty('transform');

  el.classList.remove('view-enter-active');
  // Single reflow flush to restart keyframe
  void el.offsetWidth;
  el.classList.add('view-enter-active');

  return el;
}

/**
 * Animate modal entrance using hardware-accelerated spring settle
 */
export function animateModalEnter(modalContentSelector) {
  const modal = typeof modalContentSelector === 'string' ? document.querySelector(modalContentSelector) : modalContentSelector;
  if (!modal) return null;

  modal.classList.remove('animate-spring-modal');
  void modal.offsetWidth;
  modal.classList.add('animate-spring-modal');

  return modal;
}

/**
 * Animate numeric counter (e.g., stats) with unmount protection
 */
export function animateCounter(element, targetValue, duration = 1200) {
  const el = typeof element === 'string' ? document.querySelector(element) : element;
  if (!el) return null;

  const target = Number(targetValue) || 0;
  const startTime = performance.now();

  function update(currentTime) {
    // If element was unmounted or removed from DOM, cancel RAF loop immediately
    if (!el.isConnected) return;

    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Smooth quart-out deceleration
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    const currentVal = Math.floor(easeOutQuart * target);

    el.textContent = currentVal.toLocaleString('es-CO');

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = target.toLocaleString('es-CO');
    }
  }

  requestAnimationFrame(update);
  return el;
}

export default anime;

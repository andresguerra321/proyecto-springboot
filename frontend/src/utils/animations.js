import { animate, createTimeline, stagger } from 'animejs';

/**
 * Universal anime adapter for ToolRent
 * Supports both Anime.js v4 `animate(targets, params)` and legacy `anime({ targets, ... })`
 */
export function anime(targetOrOptions, options = {}) {
  if (targetOrOptions && typeof targetOrOptions === 'object' && targetOrOptions.targets && Object.keys(options).length === 0) {
    const { targets, ...params } = targetOrOptions;
    return animate(targets, params);
  }
  return animate(targetOrOptions, options);
}

export { animate, createTimeline, stagger };

/**
 * Animate elements entering the viewport with stagger
 */
export function animateStaggerIn(selector, options = {}) {
  const elements = typeof selector === 'string' ? document.querySelectorAll(selector) : selector;
  if (!elements || (elements.length !== undefined && elements.length === 0)) return null;

  return animate(elements, {
    opacity: [0, 1],
    translateY: [24, 0],
    duration: options.duration || 600,
    delay: stagger(options.stagger || 60),
    ease: options.ease || 'outQuad',
  });
}

/**
 * Animate view / page entrance
 */
export function animateViewEntrance(containerSelector = '#app-content') {
  const el = typeof containerSelector === 'string' ? document.querySelector(containerSelector) : containerSelector;
  if (!el) return null;

  return animate(el, {
    opacity: [0, 1],
    translateY: [12, 0],
    duration: 350,
    ease: 'outCubic',
  });
}

/**
 * Animate modal entrance
 */
export function animateModalEnter(modalContentSelector) {
  const modal = typeof modalContentSelector === 'string' ? document.querySelector(modalContentSelector) : modalContentSelector;
  if (!modal) return null;

  return animate(modal, {
    opacity: [0, 1],
    scale: [0.94, 1],
    translateY: [16, 0],
    duration: 300,
    ease: 'outBack(1.4)',
  });
}

/**
 * Animate numeric counter (e.g., stats)
 */
export function animateCounter(element, targetValue, duration = 1200) {
  const el = typeof element === 'string' ? document.querySelector(element) : element;
  if (!el) return null;

  const obj = { val: 0 };
  return animate(obj, {
    val: targetValue,
    duration,
    ease: 'outExpo',
    onUpdate: () => {
      el.textContent = Math.round(obj.val).toLocaleString();
    }
  });
}

export default anime;

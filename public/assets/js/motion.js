(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const revealSelector = [
    '.page-header',
    '.section-card',
    '.calorie-main-card',
    '.macro-main-card',
    '.quiz-card',
    '.food-item',
    '.timeline-item'
  ].join(',');

  function revealAll() {
    document.querySelectorAll(revealSelector).forEach((element) => {
      element.classList.add('motion-reveal', 'is-visible');
      element.style.removeProperty('--motion-delay');
    });
  }

  function initializeMotion() {
    const elements = [...document.querySelectorAll(revealSelector)];
    if (!elements.length) return;

    document.documentElement.classList.add('motion-ready');
    if (reduceMotion.matches || !('IntersectionObserver' in window)) {
      revealAll();
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -7% 0px', threshold: 0.08 });

    function observeElement(element, index = 0) {
      if (element.classList.contains('motion-reveal')) return;
      element.classList.add('motion-reveal');
      element.style.setProperty('--motion-delay', `${Math.min(index % 6, 5) * 55}ms`);
      observer.observe(element);
    }

    elements.forEach(observeElement);

    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches(revealSelector)) observeElement(node);
          node.querySelectorAll?.(revealSelector).forEach(observeElement);
        });
      });
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });
  }

  function handleMotionPreference(event) {
    if (event.matches) revealAll();
  }

  reduceMotion.addEventListener?.('change', handleMotionPreference);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMotion, { once: true });
  } else {
    initializeMotion();
  }
})();

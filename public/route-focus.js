(() => {
  const focusRouteHeading = () => {
    const heading = document.querySelector('main h1');
    if (!(heading instanceof HTMLElement)) return;
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
    requestAnimationFrame(() => {
      const announcer = document.querySelector('#route-announcer');
      if (announcer) announcer.textContent = `${document.title} loaded.`;
    });
  };

  window.addEventListener('pageshow', focusRouteHeading);
})();

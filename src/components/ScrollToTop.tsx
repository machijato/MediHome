import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Skrolanje pri navigaciji:
// - promjena stranice (putanje) vraća na vrh,
// - promjena samo upita (filteri, kategorija, sortiranje) NE miče korisnika s mjesta,
// - navigacija sa state.scrollTo (npr. poveznica u podnožju, paginacija) skrola na taj element.
export function ScrollToTop() {
  const { pathname, key, state } = useLocation();
  const previousPath = useRef(pathname);

  useEffect(() => {
    const pathChanged = previousPath.current !== pathname;
    previousPath.current = pathname;

    const targetId = (state as { scrollTo?: string } | null)?.scrollTo;
    if (targetId) {
      // Element se možda još renderira (nova stranica), pa pokušamo nekoliko puta.
      let tries = 0;
      const attempt = () => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: pathChanged ? 'instant' : 'smooth', block: 'start' });
        } else if (tries++ < 20) {
          requestAnimationFrame(attempt);
        }
      };
      attempt();
      return;
    }

    if (pathChanged) window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, key, state]);

  return null;
}

import * as React from "react";

export const usePersistentElementScroll = (
  key: string,
  ref: React.RefObject<HTMLElement | null>,
  ready = true,
  restoreSynchronously = false,
) => {
  React.useLayoutEffect(() => {
    if (!ready) return;

    const element = ref.current;
    if (!element) return;

    const stored = Number(
      window.sessionStorage.getItem(`scroll:${key}`) ?? "0",
    );

    const restore = () => {
      element.scrollTop = Number.isFinite(stored) ? stored : 0;
    };

    if (restoreSynchronously) {
      // History keeps enough of its previous DOM mounted on the first render,
      // so restoring in the layout effect prevents a one-frame visual jump.
      restore();
    } else {
      window.requestAnimationFrame(restore);
    }

    const save = () => {
      window.sessionStorage.setItem(
        `scroll:${key}`,
        String(element.scrollTop),
      );
    };

    element.addEventListener("scroll", save, { passive: true });

    return () => {
      save();
      element.removeEventListener("scroll", save);
    };
  }, [key, ready, ref, restoreSynchronously]);
};

export const usePersistentWindowScroll = (
  key: string,
  ready = true,
) => {
  React.useLayoutEffect(() => {
    if (!ready) return;

    const stored = Number(
      window.sessionStorage.getItem(`scroll:${key}`) ?? "0",
    );

    window.requestAnimationFrame(() => {
      window.scrollTo({
        top: Number.isFinite(stored) ? stored : 0,
        behavior: "auto",
      });
    });

    const save = () => {
      window.sessionStorage.setItem(
        `scroll:${key}`,
        String(window.scrollY),
      );
    };

    window.addEventListener("scroll", save, { passive: true });

    return () => {
      save();
      window.removeEventListener("scroll", save);
    };
  }, [key, ready]);
};

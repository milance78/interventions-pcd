import * as React from "react";

export const usePersistentElementScroll = (
  key: string,
  ref: React.RefObject<HTMLElement | null>,
  ready = true,
) => {
  React.useLayoutEffect(() => {
    if (!ready) return;

    const element = ref.current;
    if (!element) return;

    const stored = Number(
      window.sessionStorage.getItem(`scroll:${key}`) ?? "0",
    );

    window.requestAnimationFrame(() => {
      element.scrollTop = Number.isFinite(stored) ? stored : 0;
    });

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
  }, [key, ready, ref]);
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

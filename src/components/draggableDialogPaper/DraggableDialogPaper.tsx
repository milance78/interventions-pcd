import * as React from "react";
import Paper, { type PaperProps } from "@mui/material/Paper";

const DraggableDialogPaper = React.forwardRef<HTMLDivElement, PaperProps>(
  function DraggableDialogPaper(props, forwardedRef) {
    const localRef = React.useRef<HTMLDivElement | null>(null);
    const [offset, setOffset] = React.useState({ x: 0, y: 0 });
    const dragRef = React.useRef({
      active: false,
      startX: 0,
      startY: 0,
      baseX: 0,
      baseY: 0,
    });
    const offsetRef = React.useRef(offset);
    offsetRef.current = offset;

    const setRefs = React.useCallback((node: HTMLDivElement | null) => {
      localRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    }, [forwardedRef]);

    React.useEffect(() => {
      const paper = localRef.current;
      if (!paper) return;

      const onPointerDown = (event: PointerEvent) => {
        if (event.button !== 0) return;
        const target = event.target as HTMLElement | null;
        if (target?.closest("button, input, textarea, select, a, [role='button'], [contenteditable='true']")) return;

        const rect = paper.getBoundingClientRect();
        // The top 56px act as a neutral drag strip. This makes dialogs with
        // custom headers draggable as well as dialogs using MUI DialogTitle.
        if (event.clientY < rect.top || event.clientY > rect.top + 56) return;

        dragRef.current = {
          active: true,
          startX: event.clientX,
          startY: event.clientY,
          baseX: offsetRef.current.x,
          baseY: offsetRef.current.y,
        };
        paper.setPointerCapture?.(event.pointerId);
        event.preventDefault();
      };

      const onPointerMove = (event: PointerEvent) => {
        if (!dragRef.current.active) return;
        setOffset({
          x: dragRef.current.baseX + event.clientX - dragRef.current.startX,
          y: dragRef.current.baseY + event.clientY - dragRef.current.startY,
        });
      };

      const onPointerUp = () => {
        dragRef.current.active = false;
      };

      paper.addEventListener("pointerdown", onPointerDown);
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);

      return () => {
        paper.removeEventListener("pointerdown", onPointerDown);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
      };
    }, []);

    return (
      <Paper
        {...props}
        ref={setRefs}
        style={{
          ...props.style,
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        }}
        className={`${props.className ?? ""} draggable-dialog-paper`.trim()}
      />
    );
  },
);

export default DraggableDialogPaper;

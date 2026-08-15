import {
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";

import "./AnimatedCircularCounter.scss";

type CounterTone = "green" | "amber" | "blue";
type CounterDirection = "clockwise" | "counterclockwise";

type AnimatedCircularCounterProps = {
  id: string;
  label: string;
  value: number;
  tone: CounterTone;
};

const START_DELAY_MS = 300;
const ANIMATION_DURATION_MS = 1050;
const STORAGE_PREFIX = "today-counter-animation-stable-v4:";

/**
 * Module memory survives route changes while the SPA remains open.
 * sessionStorage covers a remount/reload without coupling animation state
 * to Redux or to the intervention cards.
 */
const counterValueMemory = new Map<string, number>();

const readPreviousValue = (storageKey: string): number | null => {
  const inMemory = counterValueMemory.get(storageKey);

  if (typeof inMemory === "number") {
    return inMemory;
  }

  const storedValue = window.sessionStorage.getItem(storageKey);

  if (storedValue === null) {
    return null;
  }

  const parsedValue = Number(storedValue);

  return Number.isFinite(parsedValue) ? parsedValue : null;
};

const rememberValue = (storageKey: string, value: number) => {
  counterValueMemory.set(storageKey, value);
  window.sessionStorage.setItem(storageKey, String(value));
};

const AnimatedCircularCounter = ({
  id,
  label,
  value,
  tone,
}: AnimatedCircularCounterProps) => {
  const progressCircleRef = useRef<SVGCircleElement | null>(null);
  const runningAnimationRef = useRef<Animation | null>(null);
  const previousRenderedValueRef = useRef<number | null>(null);
  const storageKey = `${STORAGE_PREFIX}${id}`;

  useLayoutEffect(() => {
    const circle = progressCircleRef.current;

    if (!circle) {
      return;
    }

    runningAnimationRef.current?.cancel();
    runningAnimationRef.current = null;

    const previousValue =
      previousRenderedValueRef.current ?? readPreviousValue(storageKey);

    previousRenderedValueRef.current = value;
    rememberValue(storageKey, value);

    if (previousValue === null || previousValue === value) {
      circle.style.strokeDashoffset = "0";
      circle.style.opacity = "1";
      circle.dataset.direction = "clockwise";
      return;
    }

    const direction: CounterDirection =
      value > previousValue ? "clockwise" : "counterclockwise";

    circle.dataset.direction = direction;
    circle.style.strokeDashoffset = "100";
    circle.style.opacity = "0.42";

    // Web Animations API runs independently from React rerenders.
    runningAnimationRef.current = circle.animate(
      [
        {
          strokeDashoffset: "100",
          opacity: 0.42,
        },
        {
          strokeDashoffset: "0",
          opacity: 1,
        },
      ],
      {
        delay: START_DELAY_MS,
        duration: ANIMATION_DURATION_MS,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "forwards",
      },
    );

    runningAnimationRef.current.onfinish = () => {
      circle.style.strokeDashoffset = "0";
      circle.style.opacity = "1";
      runningAnimationRef.current = null;
    };

    return () => {
      runningAnimationRef.current?.cancel();
      runningAnimationRef.current = null;
    };
  }, [storageKey, value]);

  useEffect(
    () => () => {
      runningAnimationRef.current?.cancel();
    },
    [],
  );

  return (
    <div
      className={`animated-today-counter animated-today-counter--${tone}`}
      aria-label={`${label}: ${value}`}
    >
      <span className="animated-today-counter__label">{label}</span>

      <span className="animated-today-counter__circle">
        <svg
          className="animated-today-counter__svg"
          viewBox="0 0 88 88"
          aria-hidden="true"
        >
          <circle
            className="animated-today-counter__track"
            cx="44"
            cy="44"
            r="34"
            pathLength="100"
          />

          <circle
            ref={progressCircleRef}
            className="animated-today-counter__progress"
            cx="44"
            cy="44"
            r="34"
            pathLength="100"
            data-direction="clockwise"
          />
        </svg>

        <strong className="animated-today-counter__number">{value}</strong>
      </span>
    </div>
  );
};

export default AnimatedCircularCounter;

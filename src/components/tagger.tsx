"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveLevel } from "@/app/actions";
import type { SavedLevel } from "@/lib/levels";

const SQUARES = 100;

type Grid = {
  left: number;
  top: number;
  size: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function Tagger({
  initialLevels,
  databaseReady,
}: {
  initialLevels: SavedLevel[];
  databaseReady: boolean;
}) {
  const router = useRouter();
  const frameRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [grid, setGrid] = useState<Grid>({ left: 0.27, top: 0.28, size: 0.42 });
  const [winning, setWinning] = useState<number[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function chooseFile(next: File | null) {
    setFile(next);
    setWinning([]);
    setMessage(null);
    setPreview((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return next ? URL.createObjectURL(next) : null;
    });
  }

  function drag(event: React.PointerEvent, mode: "move" | "resize") {
    const frame = frameRef.current;
    if (!frame) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const rect = frame.getBoundingClientRect();
    const origin = {
      x: event.clientX,
      y: event.clientY,
      grid,
    };
    const aspect = rect.width / rect.height;

    function onMove(ev: PointerEvent) {
      const dx = (ev.clientX - origin.x) / rect.width;
      const dy = (ev.clientY - origin.y) / rect.height;
      setGrid(() => {
        if (mode === "move") {
          const left = clamp(origin.grid.left + dx, 0, 1 - origin.grid.size);
          const heightFrac = origin.grid.size * aspect;
          const top = clamp(origin.grid.top + dy, 0, 1 - heightFrac);
          return { ...origin.grid, left, top };
        }
        const size = clamp(origin.grid.size + dx, 0.12, 0.92);
        const left = Math.min(origin.grid.left, 1 - size);
        const heightFrac = size * aspect;
        const top = Math.min(origin.grid.top, Math.max(0, 1 - heightFrac));
        return { left, top, size };
      });
    }

    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function toggleSquare(square: number) {
    setWinning((current) =>
      current.includes(square)
        ? current.filter((item) => item !== square)
        : [...current, square].sort((a, b) => a - b),
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setMessage("Choose a picture first.");
      return;
    }
    setPending(true);
    setMessage(null);
    const body = new FormData();
    body.set("image", file);
    body.set("gridLeft", String(grid.left));
    body.set("gridTop", String(grid.top));
    body.set("gridSize", String(grid.size));
    body.set("winningSquares", JSON.stringify(winning));
    const result = await saveLevel(body);
    setPending(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setMessage("Saved. Battlenips will deal this as a level.");
    setWinning([]);
    router.refresh();
  }

  return (
    <div className="page">
      <header className="mast">
        <p className="eyebrow">Level desk · for Battlenips</p>
        <h1 className="wordmark">Niptagger</h1>
        <p className="lede">
          Upload a picture, place the grid on the chest, and mark every winning square.
        </p>
      </header>

      {!databaseReady ? (
        <p className="banner" role="status">
          The shared Supabase database is not connected yet. You can place a grid
          here, and saving a level will work after the database is linked.
        </p>
      ) : null}

      <form className="desk" onSubmit={onSubmit}>
        <div className="controls">
          <label className="upload">
            Choose a picture
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
            />
          </label>
          <p className="hint">
            Drag the black bar to move the grid. Drag the corner to change its size.
            Tap squares to mark them as wins. {winning.length} selected.
          </p>
          <button className="save" type="submit" disabled={pending || !file}>
            {pending ? "Saving…" : "Save level"}
          </button>
          {message ? <p className="message">{message}</p> : null}
        </div>

        <div className="stage">
          {preview ? (
            <div className="frame" ref={frameRef}>
              <img src={preview} alt="Picture being tagged" />
              <div
                className="grid"
                style={{
                  left: `${grid.left * 100}%`,
                  top: `${grid.top * 100}%`,
                  width: `${grid.size * 100}%`,
                }}
              >
                <button
                  type="button"
                  className="mover"
                  onPointerDown={(event) => drag(event, "move")}
                >
                  Drag grid
                </button>
                {Array.from({ length: SQUARES }, (_, index) => {
                  const square = index + 1;
                  const selected = winning.includes(square);
                  return (
                    <button
                      key={square}
                      type="button"
                      className={selected ? "cell selected" : "cell"}
                      aria-pressed={selected}
                      aria-label={`Square ${square}`}
                      onClick={() => toggleSquare(square)}
                    >
                      {square}
                    </button>
                  );
                })}
                <button
                  type="button"
                  className="resizer"
                  aria-label="Resize grid"
                  onPointerDown={(event) => drag(event, "resize")}
                />
              </div>
            </div>
          ) : (
            <p className="empty">The picture will show here.</p>
          )}
        </div>
      </form>

      <section className="saved">
        <h2>Levels for Battlenips</h2>
        {initialLevels.length === 0 ? (
          <p>No saved levels yet. Battlenips keeps its starter photograph until one is saved.</p>
        ) : (
          <ul>
            {initialLevels.map((level) => (
              <li key={level.id}>
                <img src={level.imageUrl} alt="" />
                <span>
                  Squares {level.winningSquares.join(", ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

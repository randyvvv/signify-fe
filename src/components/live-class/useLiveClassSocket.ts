"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { getToken } from "@/lib/api";
import {
  liveSocketUrl,
  type LiveClass,
  type LiveRole,
  type LiveSegment,
  type LiveServerEvent,
  type LiveStatus,
} from "@/lib/live-class";

export type Connection = "connecting" | "open" | "reconnecting" | "closed";

export interface LiveState {
  connection: Connection;
  role: LiveRole | null;
  cls: LiveClass | null;
  status: LiveStatus | null;
  broadcasting: boolean;
  viewers: number;
  segments: LiveSegment[];
  /** Teks yang sedang diucapkan guru (belum jadi kalimat). */
  partial: string;
  /** Hasil penyiapan isyarat per kalimat: true = siap diputar avatar. */
  poses: Record<number, boolean>;
  /** Kalimat mulai seq ini diucapkan setelah perangkat ini bergabung. */
  liveFromSeq: number;
  /** Error fatal (kelas tidak ada, sesi login habis, dibuka di tab lain). */
  fatal: string | null;
}

type Action =
  | { type: "connection"; connection: Connection }
  | { type: "event"; event: LiveServerEvent }
  | { type: "fatal"; message: string };

const initial: LiveState = {
  connection: "connecting",
  role: null,
  cls: null,
  status: null,
  broadcasting: false,
  viewers: 0,
  segments: [],
  partial: "",
  poses: {},
  liveFromSeq: 0,
  fatal: null,
};

function reducer(state: LiveState, action: Action): LiveState {
  if (action.type === "connection") return { ...state, connection: action.connection };
  if (action.type === "fatal") return { ...state, fatal: action.message, connection: "closed" };

  const event = action.event;
  switch (event.type) {
    case "ready": {
      const lastSeq = event.segments.at(-1)?.seq ?? -1;
      return {
        ...state,
        connection: "open",
        role: event.role,
        cls: event.class,
        status: event.class.status,
        broadcasting: event.broadcasting,
        viewers: event.viewers,
        segments: event.segments,
        partial: "",
        liveFromSeq: Math.max(state.liveFromSeq, lastSeq + 1),
      };
    }
    case "status":
      return { ...state, status: event.status, broadcasting: event.broadcasting };
    case "partial":
      return { ...state, partial: event.text };
    case "segment":
      if (state.segments.some((s) => s.seq === event.segment.seq)) return state;
      return { ...state, segments: [...state.segments, event.segment] };
    case "pose_ready":
      return { ...state, poses: { ...state.poses, [event.seq]: event.ok } };
    case "viewers":
      return { ...state, viewers: event.count };
    default:
      return state;
  }
}

// Kode tutup dari server yang tidak perlu disambung ulang.
const NO_RECONNECT = new Set([4401, 4404, 4409, 4429]);
const FATAL_CODES = new Set(["unauthorized", "class_not_found", "replaced", "class_full"]);

export interface LiveSocketHandlers {
  /** Error yang tidak fatal (mis. transkripsi gagal dimulai). */
  onError?: (message: string, code: string) => void;
  /** Setiap event server (selain ping & error), setelah state diperbarui. */
  onEvent?: (event: LiveServerEvent) => void;
}

/**
 * Koneksi WebSocket ke satu Kelas Live: auth lewat pesan pertama, state siaran
 * dari event server, dan sambung ulang otomatis bila koneksi putus.
 */
export function useLiveClassSocket(code: string, handlers: LiveSocketHandlers = {}) {
  const [state, dispatch] = useReducer(reducer, initial);
  const socketRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    let disposed = false;
    let attempt = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      const token = getToken();
      if (!token) {
        dispatch({ type: "fatal", message: "Silakan login dulu" });
        return;
      }
      const ws = new WebSocket(liveSocketUrl());
      ws.binaryType = "arraybuffer";
      socketRef.current = ws;

      ws.onopen = () => ws.send(JSON.stringify({ type: "auth", token, code }));
      ws.onmessage = (message) => {
        let event: LiveServerEvent;
        try {
          event = JSON.parse(String(message.data)) as LiveServerEvent;
        } catch {
          return;
        }
        if (event.type === "ping") return;
        if (event.type === "ready") attempt = 0;
        if (event.type === "error") {
          if (FATAL_CODES.has(event.code)) dispatch({ type: "fatal", message: event.message });
          else handlersRef.current.onError?.(event.message, event.code);
          return;
        }
        dispatch({ type: "event", event });
        handlersRef.current.onEvent?.(event);
      };
      ws.onclose = (event) => {
        if (socketRef.current === ws) socketRef.current = null;
        if (disposed || NO_RECONNECT.has(event.code)) {
          if (!disposed) dispatch({ type: "connection", connection: "closed" });
          return;
        }
        dispatch({ type: "connection", connection: "reconnecting" });
        const delay = Math.min(10_000, 1000 * 2 ** attempt++);
        retryTimer = setTimeout(connect, delay);
      };
    };

    connect();
    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      socketRef.current?.close(1000, "leave");
      socketRef.current = null;
    };
  }, [code]);

  const command = useCallback((type: "start" | "stop" | "end") => {
    const ws = socketRef.current;
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type }));
  }, []);

  const sendAudio = useCallback((pcm: ArrayBuffer) => {
    const ws = socketRef.current;
    // Lewati potongan audio bila koneksi tersendat, supaya subtitle tidak makin tertinggal.
    if (ws?.readyState === WebSocket.OPEN && ws.bufferedAmount < 256 * 1024) ws.send(pcm);
  }, []);

  return { state, command, sendAudio };
}

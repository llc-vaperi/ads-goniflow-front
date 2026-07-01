"use client";

import React, { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import type { EventInput, EventClickArg, DateSelectArg, EventDropArg } from "@fullcalendar/core";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  platform: string;
  tone: string;
  headline?: string;
  text?: string;
  cta?: string;
  allDay?: boolean;
}

interface GoniflowCalendarProps {
  events: CalendarEvent[];
  onAddEvent: (event: Omit<CalendarEvent, "id">) => void;
  onUpdateEvent: (id: string, changes: Partial<CalendarEvent>) => void;
  onDeleteEvent: (id: string) => void;
  /** Called when user wants to go to Generator for a specific date */
  onNavigateToGenerator: (date: string) => void;
  /** Called when user wants to edit a calendar event in the Generator */
  onNavigateToGeneratorForEdit?: (event: CalendarEvent) => void;
  /** Pending event from Generator to be placed on calendar */
  pendingEvent?: Omit<CalendarEvent, "id" | "start"> | null;
  onPendingEventConsumed?: () => void;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const PLATFORMS = [
  { id: "facebook",  label: "Facebook",  icon: "🔵", color: "#3b82f6",  bg: "rgba(59,130,246,0.15)",  border: "rgba(59,130,246,0.5)"  },
  { id: "instagram", label: "Instagram", icon: "📸", color: "#ec4899",  bg: "rgba(236,72,153,0.15)",  border: "rgba(236,72,153,0.5)"  },
  { id: "linkedin",  label: "LinkedIn",  icon: "💼", color: "#14b8a6",  bg: "rgba(20,184,166,0.15)",  border: "rgba(20,184,166,0.5)"  },
  { id: "x",         label: "X",         icon: "🐦", color: "#94a3b8",  bg: "rgba(148,163,184,0.15)", border: "rgba(148,163,184,0.5)" },
];

const TONES = [
  { id: "professional", label: "💼 ოფიციალური" },
  { id: "friendly",     label: "👋 მეგობრული"  },
  { id: "funny",        label: "😎 ხუმარა"     },
  { id: "bold",         label: "💥 მბზინავი"   },
];

const getPCfg  = (id: string) => PLATFORMS.find(p => p.id === id) ?? PLATFORMS[0];
const getTCfg  = (id: string) => TONES.find(t => t.id === id);

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("ka-GE", { day: "numeric", month: "long", year: "numeric" });

const fmtTime = (s: string) => {
  if (!s.includes("T")) return "";
  const d = new Date(s);
  return d.toLocaleTimeString("ka-GE", { hour: "2-digit", minute: "2-digit" });
};

// ─── Component ─────────────────────────────────────────────────────────────────

export default function GoniflowCalendar({
  events,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onNavigateToGenerator,
  onNavigateToGeneratorForEdit,
  pendingEvent,
  onPendingEventConsumed,
}: GoniflowCalendarProps) {
  const calRef = useRef<FullCalendar>(null);

  // ── Simple date-click modal (just date/time + navigate button) ──────────────
  const [quickModal, setQuickModal] = useState<{ date: string; time: string } | null>(null);

  // ── Edit modal (for editing existing events) ───────────────────────────────
  const [editModal, setEditModal] = useState<CalendarEvent | null>(null);
  const [editPlatform, setEditPlatform] = useState("facebook");
  const [editTone, setEditTone] = useState("professional");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("10:00");

  // ── Event detail popover ───────────────────────────────────────────────────
  const [detail, setDetail] = useState<{ event: CalendarEvent; x: number; y: number } | null>(null);

  // ── Copy event state ───────────────────────────────────────────────────────
  const [copySource, setCopySource] = useState<CalendarEvent | null>(null);
  const [copyDate, setCopyDate] = useState("");
  const [copyTime, setCopyTime] = useState("10:00");

  // ── Pending event day picker (from generator → calendar) ───────────────────
  const [dayPicker, setDayPicker] = useState<Omit<CalendarEvent, "id" | "start"> | null>(null);
  const [dpDate, setDpDate] = useState(new Date().toISOString().split("T")[0]);
  const [dpTime, setDpTime] = useState("10:00");

  // ── Handle pending from generator ──────────────────────────────────────────
  useEffect(() => {
    if (pendingEvent) {
      setDayPicker(pendingEvent);
      setDpDate(new Date().toISOString().split("T")[0]);
      setDpTime("10:00");
      onPendingEventConsumed?.();
    }
  }, [pendingEvent, onPendingEventConsumed]);

  // ── FC events ──────────────────────────────────────────────────────────────
  const fcEvents: EventInput[] = events.map(ev => {
    const p = getPCfg(ev.platform);
    return {
      id: ev.id,
      title: `${p.icon} ${p.label}`,
      start: ev.start,
      end: ev.end,
      allDay: ev.allDay ?? true,
      backgroundColor: p.bg,
      borderColor: p.border,
      textColor: p.color,
      extendedProps: { ...ev },
    };
  });

  // ── Date select handler ────────────────────────────────────────────────────
  const handleDateSelect = (arg: DateSelectArg) => {
    const dateStr = arg.startStr.split("T")[0];
    setQuickModal({ date: dateStr, time: "10:00" });
    setDetail(null);
    calRef.current?.getApi().unselect();
  };

  // ── Event click handler ────────────────────────────────────────────────────
  const handleEventClick = (arg: EventClickArg) => {
    const ev = events.find(e => e.id === arg.event.id);
    if (!ev) return;
    const rect = arg.el.getBoundingClientRect();
    setDetail({
      event: ev,
      x: rect.left + rect.width / 2,
      y: rect.bottom + window.scrollY + 8,
    });
    setQuickModal(null);
  };

  // ── Drag & drop (with Alt/Ctrl to copy) ───────────────────────────────────
  const handleEventDrop = (arg: EventDropArg) => {
    const isCopy = arg.jsEvent.altKey || arg.jsEvent.ctrlKey;
    const newStart = arg.event.startStr.split("T")[0];
    const ev = events.find(e => e.id === arg.event.id);
    if (!ev) return;

    if (isCopy) {
      // Revert the calendar move and add a duplicate event instead
      arg.revert();
      const p = getPCfg(ev.platform);
      onAddEvent({
        title: `${p.icon} ${p.label}`,
        start: newStart + (ev.start.includes("T") ? "T" + ev.start.split("T")[1] : "T10:00:00"),
        platform: ev.platform,
        tone: ev.tone,
        headline: ev.headline,
        text: ev.text,
        cta: ev.cta,
        allDay: ev.allDay,
      });
    } else {
      onUpdateEvent(arg.event.id, { start: newStart });
    }
  };

  // ── Open edit modal ────────────────────────────────────────────────────────
  const openEdit = (ev: CalendarEvent) => {
    setEditModal(ev);
    setEditPlatform(ev.platform);
    setEditTone(ev.tone);
    const d = new Date(ev.start);
    setEditDate(d.toISOString().split("T")[0]);
    setEditTime(ev.start.includes("T") ? d.toISOString().split("T")[1].slice(0, 5) : "10:00");
    setDetail(null);
  };

  // ── Save edit ──────────────────────────────────────────────────────────────
  const saveEdit = () => {
    if (!editModal || !editDate) return;
    onUpdateEvent(editModal.id, {
      platform: editPlatform,
      tone: editTone,
      start: `${editDate}T${editTime}:00`,
    });
    setEditModal(null);
  };

  // ── Copy event ─────────────────────────────────────────────────────────────
  const startCopy = (ev: CalendarEvent) => {
    setCopySource(ev);
    setCopyDate(new Date().toISOString().split("T")[0]);
    setCopyTime("10:00");
    setDetail(null);
  };

  const confirmCopy = () => {
    if (!copySource || !copyDate) return;
    const p = getPCfg(copySource.platform);
    onAddEvent({
      title: `${p.icon} ${p.label}`,
      start: `${copyDate}T${copyTime}:00`,
      platform: copySource.platform,
      tone: copySource.tone,
      headline: copySource.headline,
      text: copySource.text,
      cta: copySource.cta,
      allDay: false,
    });
    setCopySource(null);
  };

  // ── Add pending event ──────────────────────────────────────────────────────
  const confirmPending = () => {
    if (!dayPicker || !dpDate) return;
    const p = getPCfg(dayPicker.platform);
    onAddEvent({
      title: `${p.icon} ${p.label}`,
      start: `${dpDate}T${dpTime}:00`,
      platform: dayPicker.platform,
      tone: dayPicker.tone,
      headline: dayPicker.headline,
      text: dayPicker.text,
      cta: dayPicker.cta,
      allDay: false,
    });
    setDayPicker(null);
  };

  // ── Custom event content ───────────────────────────────────────────────────
  const renderEvent = (info: any) => {
    const ev: CalendarEvent = info.event.extendedProps;
    const p = getPCfg(ev.platform);
    const t = getTCfg(ev.tone);
    return (
      <div className="px-1.5 py-0.5 w-full overflow-hidden relative group/event">
        <div className="text-[11px] font-bold truncate leading-tight pr-4">{p.icon} {p.label}</div>
        {t && <div className="text-[9px] opacity-70 truncate">{t.label.split(" ")[1]}</div>}
        <button
          onClick={(e) => {
            e.stopPropagation();
            startCopy(ev);
          }}
          className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/event:opacity-100 transition-opacity bg-slate-900/90 border border-slate-700 hover:bg-slate-800 text-[9px] p-0.5 rounded shadow"
          title="კოპირება"
        >
          📋
        </button>
      </div>
    );
  };

  // ───────────────────────────────────────────────────────────────────────────

  return (
    <div className="goniflow-calendar-wrap relative">

      {/* ── Pending event banner ───────────────────────────────────────────── */}
      {dayPicker && !copySource && !quickModal && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 animate-fade-in">
          <span className="text-emerald-400 text-lg">📅</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-emerald-300">გენერირებული პოსტი მზადაა!</p>
            <p className="text-xs text-emerald-400/70 mt-0.5">
              {getPCfg(dayPicker.platform).icon} {getPCfg(dayPicker.platform).label} · {getTCfg(dayPicker.tone)?.label}
            </p>
            {dayPicker.headline && (
              <p className="text-[10px] text-emerald-400/60 mt-0.5 truncate">{dayPicker.headline}</p>
            )}
          </div>
          <button
            onClick={() => {
              setCopySource(null);
              setQuickModal(null);
            }}
            className="text-xs font-bold text-emerald-300 bg-emerald-500/20 hover:bg-emerald-500/30 px-3 py-1.5 rounded-xl transition-colors"
          >
            თარიღის არჩევა →
          </button>
          <button onClick={() => setDayPicker(null)} className="text-emerald-600 hover:text-emerald-400 transition-colors text-xs">✕</button>
        </div>
      )}

      {/* ── Full Calendar ─────────────────────────────────────────────────── */}
      <div className="fc-goniflow rounded-2xl overflow-hidden border border-slate-800">
        <FullCalendar
          ref={calRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
          }}
          buttonText={{ today: "დღეს", month: "თვე", week: "კვირა", day: "დღე", list: "სია" }}
          locale="ka"
          firstDay={1}
          selectable
          selectMirror
          editable
          droppable
          dayMaxEvents={3}
          height="auto"
          events={fcEvents}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventContent={renderEvent}
          nowIndicator
          eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
          slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* QUICK MODAL — date click: just date/time + navigate button         */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {quickModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-xs rounded-2xl border border-slate-700 bg-slate-950 p-6 shadow-2xl space-y-5 animate-scale-in">

            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="text-2xl">📅</span>
                <span>განრიგის ჩანაწერი</span>
              </h3>
              <button onClick={() => setQuickModal(null)} className="text-slate-400 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Date & Time inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">თარიღი</label>
                <input
                  type="date"
                  value={quickModal.date}
                  onChange={e => setQuickModal({ ...quickModal, date: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-slate-100 text-xs outline-none focus:border-indigo-500/70 [color-scheme:dark]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">დრო</label>
                <input
                  type="time"
                  value={quickModal.time}
                  onChange={e => setQuickModal({ ...quickModal, time: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-slate-100 text-xs outline-none focus:border-indigo-500/70 [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Chosen date display */}
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-500/8 border border-indigo-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-indigo-400 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
              <div>
                <p className="text-xs font-bold text-indigo-300">{fmtDate(quickModal.date)}</p>
                <p className="text-[10px] text-indigo-400/70">{quickModal.time}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  // Navigate to generator with this date stored
                  onNavigateToGenerator(quickModal.date + "T" + quickModal.time + ":00");
                  setQuickModal(null);
                }}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/15 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                🚀 პოსტის შექმნა
              </button>
              <button
                onClick={() => setQuickModal(null)}
                className="w-full py-2 border border-slate-700 text-slate-400 font-semibold text-xs rounded-xl hover:bg-slate-900 transition-colors"
              >
                გაუქმება
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* EVENT DETAIL POPOVER                                                */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {detail && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setDetail(null)} />
          <div
            className="fixed z-50 w-72 rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl shadow-black/50 p-4 space-y-3 animate-scale-in"
            style={{
              left: Math.min(detail.x - 144, window.innerWidth - 300),
              top: Math.min(detail.y, window.innerHeight - 320),
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: getPCfg(detail.event.platform).color }} />
                <span className="text-sm font-bold text-white">{getPCfg(detail.event.platform).label}</span>
                <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded-full">
                  {getTCfg(detail.event.tone)?.label.split(" ")[1]}
                </span>
              </div>
              <button onClick={() => setDetail(null)} className="text-slate-500 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Date */}
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
              {fmtDate(detail.event.start)}
              {fmtTime(detail.event.start) && <span className="ml-1">· {fmtTime(detail.event.start)}</span>}
            </div>

            {/* Content preview */}
            {detail.event.headline && (
              <div className="text-xs text-white font-semibold line-clamp-2 leading-relaxed bg-slate-900 rounded-xl px-3 py-2">
                {detail.event.headline}
              </div>
            )}
            {detail.event.text && !detail.event.headline && (
              <div className="text-xs text-slate-300 line-clamp-3 leading-relaxed bg-slate-900 rounded-xl px-3 py-2">
                {detail.event.text}
              </div>
            )}
            {detail.event.cta && (
              <div className="text-[10px] text-indigo-400 font-bold">CTA: {detail.event.cta}</div>
            )}

            {/* Actions row 1 */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (onNavigateToGeneratorForEdit) {
                    onNavigateToGeneratorForEdit(detail.event);
                  } else {
                    openEdit(detail.event);
                  }
                }}
                className="flex-1 py-2 text-xs font-bold rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 transition-colors flex items-center justify-center gap-1"
              >
                ✏️ რედაქტირება
              </button>
              {/* COPY BUTTON */}
              <button
                onClick={() => startCopy(detail.event)}
                className="flex-1 py-2 text-xs font-bold rounded-xl border border-sky-800/50 bg-sky-950/40 hover:bg-sky-950/80 text-sky-300 transition-colors flex items-center justify-center gap-1"
              >
                📋 კოპირება
              </button>
            </div>

            {/* Actions row 2 */}
            <button
              onClick={() => {
                onDeleteEvent(detail.event.id);
                setDetail(null);
              }}
              className="w-full py-2 text-xs font-bold rounded-xl text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/50 transition-colors"
            >
              🗑 განრიგიდან წაშლა
            </button>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* EDIT MODAL — edit existing event                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">✏️ ჩანაწერის რედაქტირება</h3>
              <button onClick={() => setEditModal(null)} className="text-slate-400 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">თარიღი</label>
                <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-slate-100 text-xs outline-none focus:border-indigo-500/50 [color-scheme:dark]" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">დრო</label>
                <input type="time" value={editTime} onChange={e => setEditTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-slate-100 text-xs outline-none focus:border-indigo-500/50 [color-scheme:dark]" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">პლატფორმა</label>
              <div className="grid grid-cols-2 gap-2">
                {PLATFORMS.map(p => (
                  <button key={p.id} onClick={() => setEditPlatform(p.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                      editPlatform === p.id ? "border-indigo-500 bg-indigo-500/10 text-white" : "border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}>
                    {p.icon} {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">ტონი</label>
              <div className="grid grid-cols-2 gap-2">
                {TONES.map(t => (
                  <button key={t.id} onClick={() => setEditTone(t.id)}
                    className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                      editTone === t.id ? "border-indigo-500 bg-indigo-500/10 text-white" : "border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setEditModal(null)}
                className="flex-1 py-3 border border-slate-800 text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-900 transition-colors">
                გაუქმება
              </button>
              <button onClick={saveEdit} disabled={!editDate}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg transition-colors disabled:opacity-50">
                ✓ შენახვა
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* COPY MODAL                                                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {copySource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-xs rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>📋</span> ჩანაწერის კოპირება
              </h3>
              <button onClick={() => setCopySource(null)} className="text-slate-400 hover:text-white transition-colors text-xs">✕</button>
            </div>

            {/* Source preview */}
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-900/60">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getPCfg(copySource.platform).color }} />
              <div className="min-w-0">
                <p className="text-xs font-bold text-white">{getPCfg(copySource.platform).label}</p>
                {copySource.headline && (
                  <p className="text-[10px] text-slate-400 truncate">{copySource.headline}</p>
                )}
              </div>
              <span className="text-[10px] text-slate-500 shrink-0">{fmtDate(copySource.start)}</span>
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center text-slate-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
              </svg>
            </div>

            {/* Target date & time */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">კოპირება ამ თარიღზე</label>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={copyDate} onChange={e => setCopyDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-slate-100 text-xs outline-none focus:border-sky-500/50 [color-scheme:dark]" />
                <input type="time" value={copyTime} onChange={e => setCopyTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-slate-100 text-xs outline-none focus:border-sky-500/50 [color-scheme:dark]" />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setCopySource(null)}
                className="flex-1 py-2.5 border border-slate-800 text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-900 transition-colors">
                გაუქმება
              </button>
              <button onClick={confirmCopy} disabled={!copyDate}
                className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
                📋 კოპირება
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* DAY PICKER — place pending event from generator                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {dayPicker && !copySource && !quickModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-xs rounded-2xl border border-emerald-800/40 bg-slate-950 p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>📅</span> კალენდარში დამატება
              </h3>
              <button onClick={() => setDayPicker(null)} className="text-slate-400 hover:text-white transition-colors text-xs">✕</button>
            </div>

            {/* Post preview */}
            <div className="p-3 rounded-xl border border-emerald-800/30 bg-emerald-950/20 space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getPCfg(dayPicker.platform).color }} />
                <p className="text-xs font-bold text-emerald-300">{getPCfg(dayPicker.platform).label}</p>
                <span className="text-[10px] text-slate-500">{getTCfg(dayPicker.tone)?.label}</span>
              </div>
              {dayPicker.headline && (
                <p className="text-[10px] text-slate-300 line-clamp-2 leading-relaxed">{dayPicker.headline}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">თარიღი და დრო</label>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={dpDate} onChange={e => setDpDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-slate-100 text-xs outline-none focus:border-emerald-500/50 [color-scheme:dark]" />
                <input type="time" value={dpTime} onChange={e => setDpTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-slate-100 text-xs outline-none focus:border-emerald-500/50 [color-scheme:dark]" />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setDayPicker(null)}
                className="flex-1 py-2.5 border border-slate-800 text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-900 transition-colors">
                გაუქმება
              </button>
              <button onClick={confirmPending} disabled={!dpDate}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
                ✓ კალენდარში დამატება
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FullCalendar CSS ──────────────────────────────────────────────── */}
      <style>{`
        .fc-goniflow {
          --fc-border-color: rgba(51,65,85,0.6);
          --fc-page-bg-color: transparent;
          --fc-today-bg-color: rgba(99,102,241,0.06);
          --fc-highlight-color: rgba(99,102,241,0.12);
          --fc-neutral-bg-color: rgba(15,23,42,0.8);
          --fc-list-event-hover-bg-color: rgba(30,41,59,0.8);
          font-family: var(--font-sans, system-ui, sans-serif);
        }
        .fc-goniflow .fc-toolbar-title {
          font-size: 1rem; font-weight: 800; color: #f1f5f9; letter-spacing: -0.01em;
        }
        .fc-goniflow .fc-button {
          background: rgba(30,41,59,0.8) !important;
          border: 1px solid rgba(51,65,85,0.7) !important;
          color: #94a3b8 !important;
          font-size: 0.7rem !important; font-weight: 700 !important;
          padding: 0.35rem 0.75rem !important; border-radius: 0.625rem !important;
          transition: all 0.15s !important; box-shadow: none !important;
        }
        .fc-goniflow .fc-button:hover { background: rgba(51,65,85,0.9) !important; color: #e2e8f0 !important; }
        .fc-goniflow .fc-button-active,
        .fc-goniflow .fc-button-primary:not(:disabled).fc-button-active {
          background: rgba(99,102,241,0.2) !important;
          border-color: rgba(99,102,241,0.5) !important; color: #a5b4fc !important;
        }
        .fc-goniflow .fc-col-header-cell { background: rgba(15,23,42,0.6); padding: 0.5rem 0; }
        .fc-goniflow .fc-col-header-cell-cushion {
          color: #64748b; font-size: 0.7rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.08em; text-decoration: none !important;
        }
        .fc-goniflow .fc-daygrid-day-number {
          color: #94a3b8; font-size: 0.75rem; font-weight: 600; text-decoration: none !important; padding: 6px 8px;
        }
        .fc-goniflow .fc-day-today .fc-daygrid-day-number {
          background: rgba(99,102,241,0.2); border-radius: 999px; color: #a5b4fc;
          font-weight: 800; width: 26px; height: 26px;
          display: flex; align-items: center; justify-content: center; margin: 4px; padding: 0;
        }
        .fc-goniflow .fc-daygrid-day { cursor: pointer; transition: background 0.15s; }
        .fc-goniflow .fc-daygrid-day:hover { background: rgba(99,102,241,0.04); }
        .fc-goniflow .fc-event {
          border-radius: 6px !important; cursor: pointer !important;
          transition: all 0.15s !important; font-size: 11px !important; border-width: 1px !important;
        }
        .fc-goniflow .fc-event:hover {
          filter: brightness(1.25); transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
        }
        .fc-goniflow .fc-more-link { color: #6366f1 !important; font-size: 0.65rem !important; font-weight: 700 !important; }
        .fc-goniflow .fc-popover {
          background: #0f172a !important; border: 1px solid rgba(51,65,85,0.8) !important;
          border-radius: 1rem !important; box-shadow: 0 20px 60px rgba(0,0,0,0.6) !important;
        }
        .fc-goniflow .fc-popover-title {
          background: rgba(15,23,42,0.9) !important; color: #e2e8f0 !important;
          font-size: 0.7rem !important; font-weight: 700 !important;
          padding: 0.6rem 0.75rem !important; border-radius: 1rem 1rem 0 0 !important;
        }
        .fc-goniflow .fc-timegrid-slot { height: 3rem; }
        .fc-goniflow .fc-timegrid-slot-label { color: #475569; font-size: 0.65rem; font-weight: 600; }
        .fc-goniflow .fc-timegrid-now-indicator-line { border-color: #6366f1; }
        .fc-goniflow .fc-timegrid-now-indicator-arrow { border-top-color: #6366f1; }
        .fc-goniflow .fc-list-event { color: #e2e8f0; }
        .fc-goniflow .fc-list-event:hover td { background: rgba(30,41,59,0.8) !important; }
        .fc-goniflow .fc-list-day-cushion {
          background: rgba(15,23,42,0.7) !important; color: #64748b !important;
          font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
        }
        .fc-goniflow .fc-scrollgrid { border-color: rgba(51,65,85,0.4) !important; }
        .fc-goniflow .fc-scrollgrid td, .fc-goniflow .fc-scrollgrid th { border-color: rgba(51,65,85,0.4) !important; }
        .fc-goniflow .fc-day-sat .fc-daygrid-day-number,
        .fc-goniflow .fc-day-sun .fc-daygrid-day-number { color: #6366f1; }
      `}</style>
    </div>
  );
}

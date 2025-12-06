import { useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import type {
  EventInput,
  EventDropArg,
  DateSelectArg,
  EventClickArg,
} from "@fullcalendar/core";
import type { IdeaListItem } from "@/types";

interface CalendarViewProps {
  ideas: IdeaListItem[];
  onEventDrop: (ideaId: number, newDate: string) => void;
  onEventClick: (idea: IdeaListItem) => void;
  onDateSelect?: (start: Date, end: Date) => void;
  editable?: boolean;
  loading?: boolean;
}

// Status color mapping
const STATUS_COLORS: Record<string, string> = {
  pendente: "#94a3b8", // slate-400
  agendado: "#3b82f6", // blue-500
  concluido: "#10b981", // green-500
  cancelado: "#ef4444", // red-500
};

// Priority color mapping (border)
const PRIORITY_COLORS: Record<string, string> = {
  baixa: "#22c55e", // green-500
  media: "#f59e0b", // amber-500
  alta: "#ef4444", // red-500
};

export function CalendarView({
  ideas,
  onEventDrop,
  onEventClick,
  onDateSelect,
  editable = true,
  loading = false,
}: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);

  // Convert ideas to FullCalendar events
  const events: EventInput[] = ideas
    .filter((idea) => idea.data_agendada)
    .map((idea) => ({
      id: String(idea.id),
      title: idea.titulo,
      start: idea.data_agendada!,
      backgroundColor: STATUS_COLORS[idea.status] || STATUS_COLORS.pendente,
      borderColor: PRIORITY_COLORS[idea.prioridade] || PRIORITY_COLORS.media,
      extendedProps: {
        idea,
      },
    }));

  // Handle event drop (drag & drop)
  const handleEventDrop = (info: EventDropArg) => {
    const ideaId = parseInt(info.event.id);
    const newDate = info.event.start?.toISOString() || "";

    // Call parent handler
    onEventDrop(ideaId, newDate);
  };

  // Handle event click
  const handleEventClick = (info: EventClickArg) => {
    const idea = info.event.extendedProps.idea as IdeaListItem;
    onEventClick(idea);
  };

  // Handle date selection (optional)
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    if (onDateSelect) {
      onDateSelect(selectInfo.start, selectInfo.end);
    }
  };

  return (
    <div className="calendar-container bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      {loading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center z-10 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      )}

      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
        }}
        buttonText={{
          today: "Hoje",
          month: "Mês",
          week: "Semana",
          day: "Dia",
          list: "Lista",
        }}
        locale="pt-br"
        events={events}
        editable={editable}
        droppable={editable}
        eventDrop={handleEventDrop}
        eventClick={handleEventClick}
        select={handleDateSelect}
        selectable={editable}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        height="auto"
        eventTimeFormat={{
          hour: "2-digit",
          minute: "2-digit",
          meridiem: false,
        }}
        slotLabelFormat={{
          hour: "2-digit",
          minute: "2-digit",
          meridiem: false,
        }}
        eventContent={(arg) => {
          const idea = arg.event.extendedProps.idea as IdeaListItem;
          return (
            <div className="fc-event-main-frame">
              <div className="fc-event-time">{arg.timeText}</div>
              <div className="fc-event-title-container">
                <div className="fc-event-title fc-sticky truncate">
                  {arg.event.title}
                  {idea.apresentador && (
                    <span className="ml-1 text-xs opacity-75">
                      👤 {idea.apresentador.username}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        }}
        // Custom styling
        eventClassNames="cursor-pointer hover:opacity-80 transition-opacity"
      />

      {/* Custom CSS for FullCalendar dark mode */}
      <style>{`
        .calendar-container .fc {
          font-family: inherit;
        }

        /* Dark mode support */
        .dark .fc {
          color: #f3f4f6;
        }

        .dark .fc .fc-button {
          background-color: #4f46e5;
          border-color: #4f46e5;
          color: white;
        }

        .dark .fc .fc-button:hover {
          background-color: #4338ca;
          border-color: #4338ca;
        }

        .dark .fc .fc-button-active {
          background-color: #3730a3;
          border-color: #3730a3;
        }

        .dark .fc .fc-button-primary:disabled {
          background-color: #374151;
          border-color: #374151;
          opacity: 0.5;
        }

        .dark .fc-theme-standard td,
        .dark .fc-theme-standard th {
          border-color: #374151;
        }

        .dark .fc-theme-standard .fc-scrollgrid {
          border-color: #374151;
        }

        .dark .fc .fc-col-header-cell-cushion {
          color: #9ca3af;
        }

        .dark .fc .fc-daygrid-day-number {
          color: #d1d5db;
        }

        .dark .fc .fc-day-today {
          background-color: rgba(79, 70, 229, 0.1) !important;
        }

        .dark .fc .fc-list-day-cushion {
          background-color: #374151;
        }

        .dark .fc .fc-list-event:hover td {
          background-color: #374151;
        }

        /* Event styling */
        .fc-event {
          border-width: 2px !important;
          border-left-width: 4px !important;
        }

        .fc-event-main {
          padding: 2px 4px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .fc .fc-toolbar {
            flex-direction: column;
            gap: 0.5rem;
          }

          .fc .fc-toolbar-chunk {
            margin: 0.25rem 0;
          }
        }
      `}</style>
    </div>
  );
}

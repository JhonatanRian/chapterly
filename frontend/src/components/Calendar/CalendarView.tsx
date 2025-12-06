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
          const displayText = idea.apresentador
            ? `${arg.event.title} - ${idea.apresentador.username}`
            : arg.event.title;

          return (
            <div
              className="fc-event-main-frame group relative"
              title={`${idea.titulo}${idea.apresentador ? ` - ${idea.apresentador.username}` : ""} | Status: ${idea.status} | Prioridade: ${idea.prioridade}`}
            >
              <div className="fc-event-time text-xs">{arg.timeText}</div>
              <div className="fc-event-title-container">
                <div className="fc-event-title fc-sticky truncate text-sm font-medium">
                  {displayText}
                </div>
              </div>

              {/* Tooltip on hover */}
              <div className="hidden group-hover:block absolute z-50 left-0 top-full mt-1 min-w-[250px] max-w-[300px] p-3 bg-gray-900 dark:bg-gray-700 text-white rounded-lg shadow-xl border border-gray-700 dark:border-gray-600">
                <div className="space-y-2 text-xs">
                  <div>
                    <p className="font-semibold text-sm mb-1">{idea.titulo}</p>
                  </div>
                  {idea.apresentador && (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">👤</span>
                      <span>{idea.apresentador.username}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-800 dark:bg-gray-600 capitalize">
                      {idea.status}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-800 dark:bg-gray-600 capitalize">
                      {idea.prioridade}
                    </span>
                  </div>
                </div>
                {/* Tooltip arrow */}
                <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 dark:bg-gray-700 border-l border-t border-gray-700 dark:border-gray-600 transform rotate-45"></div>
              </div>
            </div>
          );
        }}
        // Custom styling
        eventClassNames="cursor-pointer hover:opacity-90 transition-all"
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

        /* Event styling - enhanced visibility */
        .fc-event {
          border-width: 2px !important;
          border-left-width: 5px !important;
          border-radius: 4px !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
        }

        .fc-event:hover {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15) !important;
          transform: translateY(-1px);
        }

        .fc-event-main {
          padding: 4px 6px !important;
          color: white !important;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .fc-event-time {
          font-weight: 600 !important;
        }

        .fc-event-title {
          font-weight: 500 !important;
          line-height: 1.3 !important;
        }

        /* Tooltip positioning fix for overflow */
        .fc-daygrid-event {
          overflow: visible !important;
        }

        .fc-event-main-frame {
          overflow: visible !important;
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

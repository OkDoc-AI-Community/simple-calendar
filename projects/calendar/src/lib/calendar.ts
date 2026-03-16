import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonSelect, IonSelectOption } from '@ionic/angular/standalone';
import { OkDocPlugin, McpTool, McpToolResult } from '@okdoc-ai/plugin-sdk';
import { OkDocNotifier } from '@okdoc-ai/plugin-sdk/angular';

interface CalendarDay {
  date: Date | null;
  day: number | null;
  isCurrentMonth: boolean;
}

@OkDocPlugin({
  id: 'odc-okdoc-simple-calendar',
  name: 'Simple Calendar',
  description: 'A simple calendar component for selecting dates',
  version: '0.0.1',
  icon: 'calendar-outline',
  namespace: 'odc-okdoc-simple-calendar',
})
@Component({
  selector: 'odc-simple-calendar',
  standalone: true,
  imports: [CommonModule, IonSelect, IonSelectOption],
  templateUrl: './calendar.html',
  styleUrls: ['./calendar.css'],
})
export class OdcSimpleCalendar {
  private notifier = inject(OkDocNotifier);

  selectedMonth = signal(new Date().getMonth());
  selectedYear = signal(new Date().getFullYear());
  selectedDate = signal<Date | null>(null);

  months = [
    { value: 0, label: 'January' },
    { value: 1, label: 'February' },
    { value: 2, label: 'March' },
    { value: 3, label: 'April' },
    { value: 4, label: 'May' },
    { value: 5, label: 'June' },
    { value: 6, label: 'July' },
    { value: 7, label: 'August' },
    { value: 8, label: 'September' },
    { value: 9, label: 'October' },
    { value: 10, label: 'November' },
    { value: 11, label: 'December' },
  ];

  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  years = Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - 10 + i);

  calendarDays = computed(() => {
    const year = this.selectedYear();
    const month = this.selectedMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: CalendarDay[] = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      const prevMonthDay = new Date(year, month, -firstDayOfWeek + i + 1);
      days.push({
        date: prevMonthDay,
        day: prevMonthDay.getDate(),
        isCurrentMonth: false,
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: new Date(year, month, day),
        day,
        isCurrentMonth: true,
      });
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextMonthDay = new Date(year, month + 1, i);
      days.push({
        date: nextMonthDay,
        day: i,
        isCurrentMonth: false,
      });
    }

    return days;
  });

  onMonthChange(event: any) {
    this.selectedMonth.set(event.detail.value);
  }

  onYearChange(event: any) {
    this.selectedYear.set(event.detail.value);
  }

  selectDate(date: Date) {
    if (!date) return;

    this.selectedDate.set(date);
    const formattedDate = this.formatDate(date);
    this.notifier.notify(`Date selected: ${formattedDate}`, 'calendar');
  }

  isSelected(date: Date | null): boolean {
    if (!date || !this.selectedDate()) return false;
    const selected = this.selectedDate()!;
    return date.toDateString() === selected.toDateString();
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  @McpTool({
    name: 'select_date',
    description: 'Select a specific date on the calendar',
    inputSchema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Date to select in ISO format (YYYY-MM-DD)',
        },
      },
      required: ['date'],
    },
  })
  async selectDateTool(args: Record<string, unknown>): Promise<McpToolResult> {
    const dateString = args['date'] as string;

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return {
          content: [{ type: 'text', text: `Invalid date format: ${dateString}` }],
          isError: true,
        };
      }

      this.selectedDate.set(date);
      this.selectedMonth.set(date.getMonth());
      this.selectedYear.set(date.getFullYear());

      const formattedDate = this.formatDate(date);
      return {
        content: [{ type: 'text', text: `Date selected: ${formattedDate}` }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error selecting date: ${error}` }],
        isError: true,
      };
    }
  }
}

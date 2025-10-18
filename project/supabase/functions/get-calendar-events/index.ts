import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  htmlLink?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const calendarId = url.searchParams.get('calendarId') || 'admin@marthomasf.org';

    console.log('Fetching calendar for ID:', calendarId);

    const publicCalendarUrl = `https://calendar.google.com/calendar/ical/${encodeURIComponent(calendarId)}/public/basic.ics`;

    console.log('Request URL:', publicCalendarUrl);

    const response = await fetch(publicCalendarUrl);

    if (!response.ok) {
      console.error('iCal fetch error:', response.status, response.statusText);
      
      return new Response(
        JSON.stringify({
          error: `Calendar not accessible. The calendar may not be public or the ID is incorrect.`,
          status: response.status,
          calendarId,
          message: 'Please ensure the calendar is set to public in Google Calendar settings.',
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      );
    }

    const icsData = await response.text();
    console.log('Successfully fetched iCal data, length:', icsData.length);

    const events = parseICalEvents(icsData);
    console.log('Parsed', events.length, 'events');

    return new Response(
      JSON.stringify({ items: events }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to fetch calendar events',
        stack: error instanceof Error ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});

function parseICalEvents(icsData: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const lines = icsData.split('\n');
  let currentEvent: Partial<CalendarEvent> | null = null;
  let currentField = '';
  let multilineValue = '';

  const now = new Date();

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    if (line.startsWith(' ') || line.startsWith('\t')) {
      multilineValue += line.substring(1);
      continue;
    }

    if (currentField && multilineValue) {
      processField(currentEvent, currentField, multilineValue);
      multilineValue = '';
      currentField = '';
    }

    if (line === 'BEGIN:VEVENT') {
      currentEvent = {
        id: '',
        summary: '',
        start: {},
        end: {},
      };
    } else if (line === 'END:VEVENT' && currentEvent) {
      const startDate = getEventDateTime(currentEvent.start);
      if (startDate && startDate >= now && currentEvent.summary) {
        events.push(currentEvent as CalendarEvent);
      }
      currentEvent = null;
    } else if (currentEvent && line.includes(':')) {
      const colonIndex = line.indexOf(':');
      const field = line.substring(0, colonIndex);
      const value = line.substring(colonIndex + 1);

      currentField = field;
      multilineValue = value;
    }
  }

  events.sort((a, b) => {
    const aDate = getEventDateTime(a.start);
    const bDate = getEventDateTime(b.start);
    return (aDate?.getTime() || 0) - (bDate?.getTime() || 0);
  });

  return events.slice(0, 50);
}

function processField(event: Partial<CalendarEvent> | null, field: string, value: string) {
  if (!event) return;

  const [fieldName] = field.split(';');

  switch (fieldName) {
    case 'UID':
      event.id = value;
      break;
    case 'SUMMARY':
      event.summary = value;
      break;
    case 'DESCRIPTION':
      event.description = value.replace(/\\n/g, '\n').replace(/\\,/g, ',');
      break;
    case 'LOCATION':
      event.location = value.replace(/\\,/g, ',');
      break;
    case 'DTSTART':
      event.start = parseDateTimeField(field, value);
      break;
    case 'DTEND':
      event.end = parseDateTimeField(field, value);
      break;
    case 'URL':
      event.htmlLink = value;
      break;
  }
}

function parseDateTimeField(field: string, value: string): { dateTime?: string; date?: string } {
  if (field.includes('VALUE=DATE')) {
    return { date: formatDate(value) };
  } else {
    return { dateTime: formatDateTime(value) };
  }
}

function formatDate(value: string): string {
  const year = value.substring(0, 4);
  const month = value.substring(4, 6);
  const day = value.substring(6, 8);
  return `${year}-${month}-${day}`;
}

function formatDateTime(value: string): string {
  const year = value.substring(0, 4);
  const month = value.substring(4, 6);
  const day = value.substring(6, 8);
  const hour = value.substring(9, 11);
  const minute = value.substring(11, 13);
  const second = value.substring(13, 15);
  return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
}

function getEventDateTime(timeObj: { dateTime?: string; date?: string } | undefined): Date | null {
  if (!timeObj) return null;
  if (timeObj.dateTime) return new Date(timeObj.dateTime);
  if (timeObj.date) return new Date(timeObj.date);
  return null;
}
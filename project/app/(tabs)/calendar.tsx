import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Linking, Image } from 'react-native';
import { Calendar as CalendarIcon, MapPin, Clock, ExternalLink } from 'lucide-react-native';
import { useChurchConfig } from '@/contexts/ChurchConfigContext';

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

export default function CalendarScreen() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { config } = useChurchConfig();

  const primaryColor = config?.primary_color || '#C41E3A';

  useEffect(() => {
    fetchCalendarEvents();
  }, [config]);

  const fetchCalendarEvents = async () => {
    try {
      setLoading(true);
      setError('');

      const calendarId = config?.calendar_id || 'admin@marthomasf.org';
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration missing');
      }

      const url = `${supabaseUrl}/functions/v1/get-calendar-events?calendarId=${encodeURIComponent(calendarId)}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Edge function error:', errorData);
        throw new Error('Failed to fetch calendar events');
      }

      const data = await response.json();
      setEvents(data.items || []);
    } catch (err) {
      console.error('Calendar error:', err);
      setError('Failed to load calendar events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const getEventDate = (event: CalendarEvent) => {
    return event.start.dateTime || event.start.date || '';
  };

  const getEventEndDate = (event: CalendarEvent) => {
    return event.end.dateTime || event.end.date || '';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getDayOfWeek = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  };

  const getDayOfMonth = (dateString: string) => {
    const date = new Date(dateString);
    return date.getDate();
  };

  const getMonth = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  };

  const isAllDayEvent = (event: CalendarEvent) => {
    return !!event.start.date && !event.start.dateTime;
  };

  const handleOpenLink = (link: string) => {
    if (link) {
      Linking.openURL(link);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: primaryColor }]}>
        {config?.logo_url ? (
          <Image source={{ uri: config.logo_url }} style={styles.logo} resizeMode="contain" />
        ) : (
          <View style={[styles.logoPlaceholder, { borderColor: '#FFFFFF' }]}>
            <Text style={styles.logoText}>Church</Text>
          </View>
        )}
        <Text style={styles.churchName}>{config?.church_name || 'Church Management'}</Text>
        <Text style={styles.headerTitle}>Church Calendar</Text>
        <Text style={styles.headerSubtitle}>Upcoming Events</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {error ? (
          <View style={styles.errorState}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: primaryColor }]}
              onPress={fetchCalendarEvents}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : events.length === 0 ? (
          <View style={styles.emptyState}>
            <CalendarIcon size={64} color="#CCC" />
            <Text style={styles.emptyStateTitle}>No upcoming events</Text>
            <Text style={styles.emptyStateText}>Check back later for new events</Text>
          </View>
        ) : (
          events.map((event) => {
            const startDate = getEventDate(event);
            const endDate = getEventEndDate(event);

            return (
              <View key={event.id} style={styles.eventCard}>
                <View style={[styles.eventDate, { backgroundColor: primaryColor }]}>
                  <Text style={styles.eventMonth}>{getMonth(startDate)}</Text>
                  <Text style={styles.eventDay}>{getDayOfMonth(startDate)}</Text>
                  <Text style={styles.eventWeekday}>{getDayOfWeek(startDate)}</Text>
                </View>

                <View style={styles.eventDetails}>
                  <Text style={styles.eventTitle}>{event.summary}</Text>

                  {event.description && (
                    <Text style={styles.eventDescription}>{event.description}</Text>
                  )}

                  <View style={styles.eventInfo}>
                    <View style={styles.eventInfoRow}>
                      <Clock size={16} color="#666" />
                      <Text style={styles.eventInfoText}>
                        {isAllDayEvent(event)
                          ? 'All Day Event'
                          : `${formatTime(startDate)} - ${formatTime(endDate)}`
                        }
                      </Text>
                    </View>

                    {event.location && (
                      <View style={styles.eventInfoRow}>
                        <MapPin size={16} color="#666" />
                        <Text style={styles.eventInfoText}>{event.location}</Text>
                      </View>
                    )}
                  </View>

                  {event.htmlLink && (
                    <TouchableOpacity
                      style={styles.eventLink}
                      onPress={() => handleOpenLink(event.htmlLink!)}
                    >
                      <ExternalLink size={16} color={primaryColor} />
                      <Text style={[styles.eventLinkText, { color: primaryColor }]}>
                        View in Google Calendar
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 8,
  },
  logoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  logoText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  churchName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventDate: {
    width: 80,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventMonth: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  eventDay: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  eventWeekday: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  eventDetails: {
    flex: 1,
    padding: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  eventInfo: {
    gap: 8,
  },
  eventInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventInfoText: {
    fontSize: 14,
    color: '#666',
  },
  eventLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  eventLinkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  errorText: {
    fontSize: 16,
    color: '#D32F2F',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

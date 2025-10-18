import { Tabs } from 'expo-router';
import { Home, Users, DollarSign, Calendar, Settings, Phone } from 'lucide-react-native';
import { useChurchConfig } from '@/contexts/ChurchConfigContext';

export default function TabLayout() {
  const { config } = useChurchConfig();
  const primaryColor = config?.primary_color || '#C41E3A';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: primaryColor,
        tabBarInactiveTintColor: '#999999',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="family"
        options={{
          title: 'Family',
          tabBarIcon: ({ size, color }) => <Users size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="directory"
        options={{
          title: 'Directory',
          tabBarIcon: ({ size, color }) => <Users size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="donations"
        options={{
          title: 'Donations',
          tabBarIcon: ({ size, color }) => <DollarSign size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ size, color }) => <Calendar size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="contact"
        options={{
          title: 'Contact',
          tabBarIcon: ({ size, color }) => <Phone size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

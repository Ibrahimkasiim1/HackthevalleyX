import { useAuth } from '@/contexts/AuthContext';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const { user, logout, isLoading } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (err) {
              console.error('Logout error:', err);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎉 Welcome to NavSense!</Text>
        <Text style={styles.subtitle}>You&apos;re successfully logged in with Auth0</Text>
      </View>

      <View style={styles.userCard}>
        <Text style={styles.cardTitle}>Your Profile</Text>
        <Text style={styles.userInfo}>Name: {user?.name || 'Not provided'}</Text>
        <Text style={styles.userInfo}>Email: {user?.email || 'Not provided'}</Text>
        <Text style={styles.userInfo}>ID: {user?.id || 'Not provided'}</Text>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        disabled={isLoading}
      >
        <Text style={styles.logoutButtonText}>
          {isLoading ? 'Logging out...' : 'Logout'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  userCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  userInfo: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
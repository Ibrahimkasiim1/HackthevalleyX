import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Place {
  description: string;
  place_id: string;
}

interface SecurePlacesAutocompleteProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onPlaceSelected: (place: Place) => void;
  style?: any;
  userLocation?: {
    latitude: number;
    longitude: number;
  };
}

export const SecurePlacesAutocomplete: React.FC<SecurePlacesAutocompleteProps> = ({
  placeholder,
  value,
  onChangeText,
  onPlaceSelected,
  style,
  userLocation,
}) => {
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounced search function
  useEffect(() => {
    if (value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchPlaces(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value]);

  const searchPlaces = async (query: string) => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      let url = `https://hackthevalleyx.onrender.com/places/autocomplete?token=supersecret&input=${encodeURIComponent(query)}`;
      
      // Add location bias if user location is available
      if (userLocation) {
        url += `&lat=${userLocation.latitude}&lng=${userLocation.longitude}`;
      }
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.predictions || []);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Places search error:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceSelect = (place: Place) => {
    onChangeText(place.description);
    onPlaceSelected(place);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const renderSuggestion = ({ item }: { item: Place }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handlePlaceSelect(item)}
    >
      <Text style={styles.suggestionText}>{item.description}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={style}>
      <TextInput
        style={styles.textInput}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#999"
        onFocus={() => value.length >= 2 && setShowSuggestions(true)}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.place_id}
            renderItem={renderSuggestion}
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  textInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  suggestionsContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  suggestionsList: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionItem: {
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  suggestionText: {
    fontSize: 16,
    color: '#333',
  },
});
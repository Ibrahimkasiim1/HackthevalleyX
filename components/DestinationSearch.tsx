// components/DestinationSearch.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  ActivityIndicator
} from 'react-native';
import { Coordinate } from '../types/navigation';

interface SearchResult {
  id: string;
  place_name: string;
  center: [number, number];
}

interface DestinationSearchProps {
  onDestinationSelect: (coordinate: Coordinate) => void;
  apiKey: string;
}

const DestinationSearch: React.FC<DestinationSearchProps> = ({
  onDestinationSelect,
  apiKey
}) => {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const searchDestinations = useCallback(async (searchQuery: string): Promise<void> => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?` +
        `access_token=${apiKey}&limit=5&types=address,place,poi`
      );
      
      const data = await response.json();
      setResults(data.features || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey]);

  const handleSelectResult = (result: SearchResult): void => {
    const coordinate: Coordinate = {
      latitude: result.center[1],
      longitude: result.center[0]
    };
    onDestinationSelect(coordinate);
    setQuery(result.place_name);
    setResults([]);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search for destination..."
        value={query}
        onChangeText={(text: string) => {
          setQuery(text);
          searchDestinations(text);
        }}
      />
      
      {isLoading && <ActivityIndicator style={styles.loader} />}
      
      <FlatList
        data={results}
        keyExtractor={(item: SearchResult) => item.id}
        renderItem={({ item }: { item: SearchResult }) => (
          <TouchableOpacity
            style={styles.resultItem}
            onPress={() => handleSelectResult(item)}
          >
            <Text style={styles.resultText}>{item.place_name}</Text>
          </TouchableOpacity>
        )}
        style={styles.resultsList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 1000,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  resultsList: {
    maxHeight: 200,
  },
  resultItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultText: {
    fontSize: 14,
  },
  loader: {
    padding: 8,
  },
});

export default DestinationSearch;
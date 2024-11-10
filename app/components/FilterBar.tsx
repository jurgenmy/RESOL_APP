// FilterBar.tsx
import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  sortDirection: 'asc' | 'desc';
}

const FilterBar = ({ searchQuery, setSearchQuery, sortBy, setSortBy, sortDirection }: FilterBarProps) => {
  const getSortIcon = (currentSortBy: string) => {
    if (sortBy !== currentSortBy) return null;
    return sortDirection === 'asc' ? 
      <Ionicons name="arrow-up" size={16} color="white" /> :
      <Ionicons name="arrow-down" size={16} color="white" />;
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar tareas..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <View style={styles.sortContainer}>
        {['nombre', 'prioridad', 'fecha'].map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.sortButton, sortBy === option && styles.activeSort]}
            onPress={() => setSortBy(option)}
          >
            <View style={styles.sortButtonContent}>
              <Text style={[
                styles.sortButtonText,
                sortBy === option && styles.activeSortText
              ]}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
              {getSortIcon(option)}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  sortContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  sortButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: '#f5f5f5',
  },
  sortButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeSort: {
    backgroundColor: '#4A90E2',
  },
  sortButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  activeSortText: {
    color: 'white',
  },
});

export default FilterBar;
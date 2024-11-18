import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  sortDirection: 'asc' | 'desc';
}

const FilterBar = ({ searchQuery, setSearchQuery, sortBy, setSortBy, sortDirection }: FilterBarProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [rotateAnimation] = useState(new Animated.Value(0));

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    Animated.timing(rotateAnimation, {
      toValue: isExpanded ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const rotate = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  const getSortIcon = (currentSortBy: string) => {
    if (sortBy !== currentSortBy) return null;
    return sortDirection === 'asc' ? 
      <Ionicons name="arrow-up" size={16} color="white" /> :
      <Ionicons name="arrow-down" size={16} color="white" />;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.headerContainer}
        onPress={toggleExpand}
      >
        <Text style={styles.headerText}> Filtros 🔎</Text>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="chevron-forward" size={24} color="#4A90E2" />
        </Animated.View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.contentContainer}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar tareas..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#bbb"
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
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 10,
    margin: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 7,
    backgroundColor: '#f7f9fc',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  contentContainer: {
    padding: 15,
    backgroundColor: '#f7f9fc',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8edf3',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  sortContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sortButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#e8edf3',
    alignItems: 'center',
  },
  sortButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '700',
  },
});

export default FilterBar;

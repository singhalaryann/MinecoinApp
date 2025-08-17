import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

const CategoryFilter = ({ selectedCategory, onCategoryChange, categories, colors }) => {
  // NEW: Use categories from props (Nova) or fallback
  const categoryList = categories || [
    'all', 'assets', 'keys', 'ranks', 'companions'
  ];

  // Category display configuration
  const categoryConfig = {
    all: { label: 'All', color: '#3aed76' },
    assets: { label: 'Assets', color: '#3B82F6' },
    keys: { label: 'Keys', color: '#F59E0B' },
    ranks: { label: 'Ranks', color: '#8B5CF6' },
    companions: { label: 'Companions', color: '#EC4899' },
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {categoryList.map((categoryId) => {
          const config = categoryConfig[categoryId] || {
            label: categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
            color: '#3aed76'
          };
          const isActive = selectedCategory === categoryId;
          
          return (
            <TouchableOpacity
              key={categoryId}
              style={[
                styles.categoryButton,
                {
                  backgroundColor: isActive ? config.color : 'transparent',
                  borderColor: config.color,
                }
              ]}
              onPress={() => onCategoryChange(categoryId)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.categoryText,
                { color: isActive ? '#0a0a0a' : colors?.text || '#ffffff' }
              ]}>
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  scrollContainer: {
    paddingHorizontal: 8,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 4,
    borderWidth: 1.5,
    minWidth: 90,
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CategoryFilter;
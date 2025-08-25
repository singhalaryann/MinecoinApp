
 import React from 'react';
 import {
   View,
   Text,
   StyleSheet,
   TouchableOpacity,
   ScrollView,
 } from 'react-native';
 import { useThemeColors } from './theme';

 const GameSectionFilter = ({ sections, selectedSection, onSectionChange }) => {
   const colors = useThemeColors();
   
   const sectionColors = {
     'all': colors.accent,
     'survival': colors.success,
     'lifesteal': colors.error,
     'creative': colors.primary,
     'pvp': colors.warning,
     'skyblock': colors.primary,
     'prison': colors.border,
   };

   return (
     <View style={styles.container}>
       <ScrollView
         horizontal
         showsHorizontalScrollIndicator={false}
         contentContainerStyle={styles.scrollContainer}
       >
         <TouchableOpacity
           style={[
             styles.sectionButton,
             { borderColor: colors.border },
             selectedSection === 'all' && [styles.selectedButton, { backgroundColor: sectionColors.all }]
           ]}
           onPress={() => onSectionChange('all')}
         >
           <Text style={[
             styles.sectionText,
             { color: colors.accent },
             selectedSection === 'all' && [styles.selectedText, { color: colors.background }]
           ]}>
             All Games
           </Text>
         </TouchableOpacity>

         {sections.map((section) => (
           <TouchableOpacity
             key={section}
             style={[
               styles.sectionButton,
               { borderColor: colors.border },
               selectedSection === section && [styles.selectedButton, { backgroundColor: sectionColors[section.toLowerCase()] || colors.accent }]
             ]}
             onPress={() => onSectionChange(section)}
           >
             <Text style={[
               styles.sectionText,
               { color: colors.accent },
               selectedSection === section && [styles.selectedText, { color: colors.background }]
             ]}>
               {section.charAt(0).toUpperCase() + section.slice(1)}
             </Text>
           </TouchableOpacity>
         ))}
       </ScrollView>
     </View>
   );
 };

 const styles = StyleSheet.create({
   container: {
     paddingVertical: 16,
     paddingHorizontal: 16,
   },
   scrollContainer: {
     paddingHorizontal: 8,
   },
   sectionButton: {
     paddingHorizontal: 20,
     paddingVertical: 12,
     borderRadius: 25,
     marginHorizontal: 6,
     borderWidth: 1,
     minWidth: 80,
     alignItems: 'center',
   },
   selectedButton: {
     elevation: 3,
   },
   sectionText: {
     fontSize: 14,
     fontWeight: '600',
   },
   selectedText: {
     fontWeight: '700',
   },
 });

 export default GameSectionFilter;

 import React from 'react';
 import {
   View,
   Text,
   StyleSheet,
   TouchableOpacity,
   ScrollView,
 } from 'react-native';
 import { colors as staticColors, useThemeColors } from './theme';

 const GameSectionFilter = ({ sections, selectedSection, onSectionChange }) => {
   // NOVA THEME - Get live colors from dashboard
   const themeColors = useThemeColors();
   const colors = themeColors || staticColors;

   const sectionColors = {
     'all': colors.accentBright,
     'survival': colors.success,
     'lifesteal': colors.error,
     'creative': colors.primary,
     'pvp': colors.warning,
     'skyblock': colors.textPrimary,
     'prison': colors.mutedText,
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
             selectedSection === 'all' && styles.selectedButton,
             { 
               backgroundColor: selectedSection === 'all' ? sectionColors.all : 'transparent',
               borderColor: colors.accentBright
             }
           ]}
           onPress={() => onSectionChange('all')}
         >
           <Text style={[
             styles.sectionText,
             selectedSection === 'all' && [styles.selectedText, { color: '#0A0A0A' }],
             { color: colors.accentBright }
           ]}>
             All Games
           </Text>
         </TouchableOpacity>

         {sections.map((section) => (
           <TouchableOpacity
             key={section}
             style={[
               styles.sectionButton,
               selectedSection === section && styles.selectedButton,
               {
                 backgroundColor: selectedSection === section
                   ? sectionColors[section.toLowerCase()] || colors.accentBright
                   : 'transparent',
                 borderColor: colors.accentBright
               }
             ]}
             onPress={() => onSectionChange(section)}
           >
             <Text style={[
               styles.sectionText,
               selectedSection === section && [styles.selectedText, { color: '#0A0A0A' }],
               { color: colors.accentBright }
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
     // color will be applied dynamically
   },
 });

 export default GameSectionFilter;
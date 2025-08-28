
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
   
   const sectionConfigs = {
     'all': { color: colors.accent, icon: '🎮' },
     'survival': { color: colors.success, icon: '🌲' },
     'lifesteal': { color: colors.error, icon: '⚔️' },
     'creative': { color: colors.accent + "22", icon: '🎨' },
     'pvp': { color: colors.warning, icon: '⚡' },
     'skyblock': { color: colors.accent + "22", icon: '☁️' },
     'prison': { color: colors.border, icon: '🔒' },
   };

   return (
     <View style={styles.container}>
       <Text style={[styles.filterTitle, { color: colors.text }]}>Filter by Game</Text>
       <ScrollView
         horizontal
         showsHorizontalScrollIndicator={false}
         contentContainerStyle={styles.scrollContainer}
       >
         <TouchableOpacity
           style={[
             styles.sectionButton,
             { 
               borderColor: colors.border,
               backgroundColor: colors.background,
             },
             selectedSection === 'all' && [
               styles.selectedButton, 
               { 
                 backgroundColor: sectionConfigs.all.color,
                 borderColor: sectionConfigs.all.color,
               }
             ]
           ]}
           onPress={() => onSectionChange('all')}
           activeOpacity={0.8}
         >
           <Text style={styles.sectionIcon}>{sectionConfigs.all.icon}</Text>
           <Text style={[
             styles.sectionText,
             { color: colors.text },
             selectedSection === 'all' && [styles.selectedText, { color: colors.white }]
           ]}>
             All Games
           </Text>
         </TouchableOpacity>

         {sections.map((section) => {
           const config = sectionConfigs[section.toLowerCase()] || sectionConfigs.all;
           return (
             <TouchableOpacity
               key={section}
               style={[
                 styles.sectionButton,
                 { 
                   borderColor: colors.border,
                   backgroundColor: colors.background,
                 },
                 selectedSection === section && [
                   styles.selectedButton, 
                   { 
                     backgroundColor: config.color,
                     borderColor: config.color,
                   }
                 ]
               ]}
               onPress={() => onSectionChange(section)}
               activeOpacity={0.8}
             >
               <Text style={styles.sectionIcon}>{config.icon}</Text>
               <Text style={[
                 styles.sectionText,
                 { color: colors.text },
                 selectedSection === section && [styles.selectedText, { color: colors.white }]
               ]}>
                 {section.charAt(0).toUpperCase() + section.slice(1)}
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
     paddingVertical: 16,
     paddingHorizontal: 20,
   },
   filterTitle: {
     fontSize: 16,
     fontWeight: '600',
     marginBottom: 12,
     marginLeft: 8,
   },
   scrollContainer: {
     paddingHorizontal: 8,
   },
   sectionButton: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingHorizontal: 16,
     paddingVertical: 10,
     borderRadius: 20,
     marginHorizontal: 6,
     borderWidth: 1,
     minWidth: 100,
     gap: 6,
   },
   selectedButton: {
     borderWidth: 1,
   },
   sectionIcon: {
     fontSize: 14,
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
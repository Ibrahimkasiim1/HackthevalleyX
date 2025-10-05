import BottomSheetComponent from '@gorhom/bottom-sheet';
import React, { useRef } from 'react';
import { StyleSheet } from 'react-native';
import { ThemedView } from './themed-view';

interface BottomSheetProps {
  children: React.ReactNode;
  snapPoints: string[];
  onSheetChanges?: (index: number) => void;
}

export function BottomSheet({ children, snapPoints, onSheetChanges }: BottomSheetProps) {
  const bottomSheetRef = useRef<BottomSheetComponent>(null);

  const handleSheetChanges = (index: number) => {
    if (onSheetChanges) {
      onSheetChanges(index);
    }
  };

  return (
    <BottomSheetComponent
      ref={bottomSheetRef}
      index={1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.indicator}
      enablePanDownToClose={false}
    >
      <ThemedView style={styles.content}>
        {children}
      </ThemedView>
    </BottomSheetComponent>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  indicator: {
    backgroundColor: '#ccc',
    width: 40,
    height: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
});

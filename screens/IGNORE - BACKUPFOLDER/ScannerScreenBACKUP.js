import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, SafeAreaView, Alert,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';

export default function ScannerScreen({ navigation, theme }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState(null);
  const cameraRef = useRef(null);
  const isProcessing = useRef(false);

  useEffect(() => {
    const getPermission = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    getPermission();
  }, []);

  const handleBarCodeScanned = async ({ type, data }) => {
    if (isProcessing.current) return;
    isProcessing.current = true;
    setScanned(true);
    setLoading(true);

    try {
      console.log('Barcode scanned:', data);

      const res = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${data}.json`
      );
      const json = await res.json();

      console.log('Response status:', json.status);

      if (!json.product) {
        Alert.alert(
          'Product not found',
          "This barcode wasn't found in our database. Try scanning again or add it manually.",
          [{
            text: 'Scan again', onPress: () => {
              setScanned(false);
              setProduct(null);
              isProcessing.current = false;
            }
          }]
        );
        setLoading(false);
        return;
      }

      const n = json.product.nutriments || {};
      const servingSize = json.product.serving_quantity || 100;
      const name = json.product.product_name || 'Unknown Product';
      const brand = json.product.brands || '';

      // Debug logs — in correct position after n is declared
      console.log('Full product keys:', Object.keys(json.product));
      console.log('Nutriments raw:', n);

      const getVal = (...keys) => {
        for (const k of keys) {
          if (n[k] !== undefined && n[k] !== null && n[k] !== '') return parseFloat(n[k]);
        }
        return 0;
      };

      setProduct({
        name,
        brand,
        emoji: '🏷️',
        calories: Math.round(getVal('energy-kcal_100g', 'energy-kcal', 'energy_100g')),
        protein: Math.round(getVal('proteins_100g', 'protein_100g', 'proteins')),
        carbs: Math.round(getVal('carbohydrates_100g', 'carbohydrate_100g', 'carbohydrates')),
        fat: Math.round(getVal('fat_100g', 'fats_100g', 'fat')),
        per: '100g',
      });

    } catch (err) {
      console.log('Fetch error:', err.message);
      Alert.alert(
        'Connection error',
        'Could not fetch product. Check your internet connection.',
        [{
          text: 'OK', onPress: () => {
            setScanned(false);
            isProcessing.current = false;
          }
        }]
      );
    }

    setLoading(false);
  };

  const handleAddMeal = () => {
    Alert.alert('Added!', `${product.name} has been logged.`);
    navigation.goBack();
  };

  const handleScanAgain = () => {
    setScanned(false);
    setProduct(null);
    isProcessing.current = false;
  };

  if (hasPermission === null) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} />
        <Text style={[styles.centeredText, { color: theme.textSecondary }]}>Requesting camera access...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text style={[styles.centeredText, { color: theme.text }]}>📷 Camera access denied</Text>
        <Text style={[styles.centeredSub, { color: theme.textSecondary }]}>Please enable camera access in your phone settings</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: theme.accent }]}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <CameraView
        key={scanned ? 'scanned' : 'scanning'}
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing="back"
        autofocus="on"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
        }}
      />

      <SafeAreaView style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Scan Barcode</Text>
        <View style={{ width: 70 }} />
      </SafeAreaView>

      {!product && (
        <View style={styles.overlay} pointerEvents="none">
          <View style={styles.scanBox}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <Text style={styles.scanHint}>
            {loading ? 'Looking up product...' : 'Point camera at a barcode'}
          </Text>
        </View>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Finding product...</Text>
        </View>
      )}

      {product && !loading && (
        <View style={styles.productCard}>
          <View style={styles.productHeader}>
            <Text style={styles.productEmoji}>{product.emoji}</Text>
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
              {product.brand ? <Text style={styles.productBrand}>{product.brand}</Text> : null}
              <Text style={styles.productPer}>Per {product.per}</Text>
            </View>
          </View>

          <View style={styles.macroRow}>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{product.calories}</Text>
              <Text style={styles.macroLabel}>Calories</Text>
            </View>
            <View style={styles.macroDivider} />
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, { color: '#FF6B6B' }]}>{product.protein}g</Text>
              <Text style={styles.macroLabel}>Protein</Text>
            </View>
            <View style={styles.macroDivider} />
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, { color: '#FFD93D' }]}>{product.carbs}g</Text>
              <Text style={styles.macroLabel}>Carbs</Text>
            </View>
            <View style={styles.macroDivider} />
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, { color: '#6BCB77' }]}>{product.fat}g</Text>
              <Text style={styles.macroLabel}>Fat</Text>
            </View>
          </View>

          <View style={styles.productButtons}>
            <TouchableOpacity style={styles.scanAgainBtn} onPress={handleScanAgain}>
              <Text style={styles.scanAgainText}>Scan Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={handleAddMeal}>
              <Text style={styles.addBtnText}>Log Meal ✓</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  centeredText: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  centeredSub: { fontSize: 14, textAlign: 'center' },
  backBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  backBtnText: { color: '#fff', fontWeight: '600' },
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8,
  },
  backButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  backButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  topTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  scanBox: { width: 260, height: 180, position: 'relative' },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: '#fff' },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 4 },
  scanHint: {
    color: '#fff', fontSize: 14, marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  loadingText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  productCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 24, gap: 16,
  },
  productHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  productEmoji: { fontSize: 36 },
  productInfo: { flex: 1, gap: 2 },
  productName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  productBrand: { fontSize: 13, color: '#64748b' },
  productPer: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  macroRow: {
    flexDirection: 'row', backgroundColor: '#f8fafc',
    borderRadius: 16, padding: 16,
    justifyContent: 'space-around', alignItems: 'center',
  },
  macroItem: { alignItems: 'center', gap: 4 },
  macroValue: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  macroLabel: { fontSize: 11, color: '#64748b' },
  macroDivider: { width: 1, height: 32, backgroundColor: '#e2e8f0' },
  productButtons: { flexDirection: 'row', gap: 12 },
  scanAgainBtn: {
    flex: 1, height: 50, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#e2e8f0',
  },
  scanAgainText: { fontSize: 15, fontWeight: '600', color: '#64748b' },
  addBtn: {
    flex: 2, height: 50, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#3b82f6',
  },
  addBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
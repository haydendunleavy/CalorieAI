import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';

export default function ScannerScreen({ navigation }) {
  const device = useCameraDevice('back');
  const [barcode, setBarcode] = useState(null);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    (async () => {
      const permission = await Camera.requestCameraPermission();
      console.log('Camera permission:', permission);
    })();
  }, []);

  const codeScanner = useCodeScanner({
    codeTypes: ['ean-13', 'ean-8', 'upc-a', 'upc-e'],
    onCodeScanned: (codes) => {
      if (locked) return;
      if (codes.length > 0) {
        setBarcode(codes[0].value);
      }
    },
  });

  const fetchFood = async (code) => {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${code}.json`
    );
    const data = await res.json();

    if (!data.product) return;

    const n = data.product.nutriments;

    console.log({
      name: data.product.product_name,
      calories: n['energy-kcal_100g'],
      protein: n.proteins_100g,
      carbs: n.carbohydrates_100g,
      fat: n.fat_100g,
    });
  };

  if (!device) return <Text>No camera found</Text>;

  return (
    <View style={{ flex: 1 }}>

      {/* BACK */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{
          position: 'absolute',
          top: 50,
          left: 20,
          zIndex: 10,
          backgroundColor: 'rgba(0,0,0,0.5)',
          padding: 10,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: 'white' }}>← Back</Text>
      </TouchableOpacity>

      {/* CAMERA */}
      <Camera
        style={{ flex: 1 }}
        device={device}
        isActive={true}
        codeScanner={codeScanner}
      />

      {/* SCAN BOX */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: '30%',
          alignSelf: 'center',
          width: 260,
          height: 260,
          borderWidth: 2,
          borderColor: 'white',
          borderRadius: 12,
        }}
      />

      {/* SCAN BUTTON */}
      {barcode && (
        <TouchableOpacity
          onPress={async () => {
            setLocked(true);
            await fetchFood(barcode);

            setTimeout(() => {
              setBarcode(null);
              setLocked(false);
            }, 1500);
          }}
          style={{
            position: 'absolute',
            bottom: 50,
            alignSelf: 'center',
            backgroundColor: 'black',
            paddingHorizontal: 24,
            paddingVertical: 14,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: 'white' }}>
            SCAN PRODUCT
          </Text>
        </TouchableOpacity>
      )}

    </View>
  );
}
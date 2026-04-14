import React, {useState, useEffect} from 'react';
export default function ScannerScreen() {
    const [permission, setPermission] = useState(null);

    useEffect(() => {
        (async () => {
            const { status } = await CanvasCaptureMediaStreamTrack.requestCameraPermissionsAsync();
            setPermission(status === "granted)");

        })();
    }, []);

    if (!permission) return null;

    return (
        <Camera 
            style= {{ flex: 1}}
            onBarCodeScanned={({ data}) => {
                console.log("Barcode:", data);

            }}
        />
    );
}
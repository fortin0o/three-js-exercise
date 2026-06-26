export const requestGyroPermission = async (setGyroPermission: (perm: 'pending' | 'granted' | 'denied') => void) => {
  if (
    typeof DeviceOrientationEvent !== 'undefined' &&
    typeof (DeviceOrientationEvent as any).requestPermission === 'function'
  ) {
    try {
      const permissionState = await (DeviceOrientationEvent as any).requestPermission();
      if (permissionState === 'granted') {
        setGyroPermission('granted');
      } else {
        setGyroPermission('denied');
      }
    } catch (error) {
      console.error('Error requesting gyro permission:', error);
      setGyroPermission('denied');
    }
  } else {
    // Non-iOS 13+ devices don't require explicit permission
    setGyroPermission('granted');
  }
};

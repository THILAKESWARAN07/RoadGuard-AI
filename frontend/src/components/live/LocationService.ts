export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export type GPSStatusType =
  | 'off'
  | 'searching'
  | 'found'
  | 'denied'
  | 'unavailable';

export class LocationService {
  private watchId: number | null = null;
  private currentPosition: LocationData | null = null;
  private status: GPSStatusType = 'off';

  public startTracking(
    onStatusChange: (status: GPSStatusType, location: LocationData | null) => void
  ) {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      this.status = 'unavailable';
      onStatusChange(this.status, null);
      return;
    }

    this.status = 'searching';
    onStatusChange(this.status, null);

    const successCallback = (position: GeolocationPosition) => {
      const loc: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      };
      this.currentPosition = loc;
      this.status = 'found';
      onStatusChange(this.status, loc);
    };

    const errorCallback = (error: GeolocationPositionError) => {
      console.warn('Geolocation error:', error.message);
      if (error.code === error.PERMISSION_DENIED) {
        this.status = 'denied';
      } else {
        this.status = 'unavailable';
      }
      this.currentPosition = null;
      onStatusChange(this.status, null);
    };

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    try {
      this.watchId = navigator.geolocation.watchPosition(
        successCallback,
        errorCallback,
        options
      );
    } catch (err) {
      console.error('Failed to register watchPosition:', err);
      this.status = 'unavailable';
      onStatusChange(this.status, null);
    }
  }

  public stopTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.currentPosition = null;
    this.status = 'off';
  }

  public getCurrentLocation(): LocationData | null {
    return this.currentPosition;
  }
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  imageName: string;
  thumbnail: string; // Base64 compressed representation (~400px max dimension)
  status: 'active' | 'repaired' | 'ignored';
  notes: string;
  summary: {
    total_detections: number;
    pothole_count: number;
    manhole_count: number;
    highest_severity: string;
    average_confidence: number;
    processing_time_ms: number;
  };
  detections: Array<{
    class_id: number;
    class_name: string;
    confidence: number;
    severity: string;
    bbox: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      width: number;
      height: number;
    };
    area: number;
  }>;
  gps?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
  } | null | 'GPS Unavailable';
  estimatedDistance?: number;
  modelName?: string;
  inferenceTime?: number;
  weather?: string;
  roadType?: string;
  speedEstimate?: number;
  deviceName?: string;
  sessionId?: string;
  captureReason?: string;
  // New optional fields for citizen reports
  reportType?: 'ai' | 'citizen';
  reportSource?: 'camera' | 'manual';
  reporterName?: string;
  email?: string;
  phone?: string;
  description?: string;
  createdBy?: string;
}

export interface HistoryStats {
  totalImages: number;
  totalPotholes: number;
  totalManholes: number;
  averageConfidence: number;
  averageProcessingTime: number;
  highestSeverityCount: number;
  detectionsToday: number;
  detectionsThisWeek: number;
  repairRate: number;
  severityBreakdown: {
    high: number;
    medium: number;
    low: number;
    none: number;
  };
}

export interface HistoryFilters {
  damageType: 'all' | 'potholes' | 'manholes' | 'none';
  severity: 'all' | 'high' | 'medium' | 'low';
  timeRange: 'all' | 'today' | 'week' | 'month';
  minConfidence: number; // 0.20 to 0.95
}

export type SortOption =
  | 'newest'
  | 'oldest'
  | 'highest_confidence'
  | 'lowest_confidence'
  | 'most_detections'
  | 'least_detections'
  | 'fastest_processing'
  | 'slowest_processing';

export interface HistoryRepository {
  saveDetection(item: Omit<HistoryItem, 'id' | 'timestamp' | 'status' | 'notes'>): Promise<HistoryItem>;
  getAllDetections(): Promise<HistoryItem[]>;
  deleteDetection(id: string): Promise<void>;
  clearHistory(): Promise<void>;
  updateDetection(id: string, updates: Partial<HistoryItem>): Promise<HistoryItem>;
  getStatistics(): Promise<HistoryStats>;
}

// Helper to compress images to thumbnail data URL (< 400px width/height JPEG)
export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 400; // Optimal size for viewer display without massive payload
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string || '');
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Save as JPEG with 0.7 quality to drop file sizes to ~15KB
        resolve(canvas.toDataURL('image/jpeg', 0.70));
      };
      img.onerror = (e) => reject(new Error('Failed to load image element for resizing'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read uploaded file'));
    reader.readAsDataURL(file);
  });
}

const LOCAL_STORAGE_KEY = 'roadguard_detection_history';

class LocalStorageHistoryRepository implements HistoryRepository {
  async getAllDetections(): Promise<HistoryItem[]> {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data) as HistoryItem[];
      // Return sorted by newest timestamp by default
      return parsed.sort((a, b) => b.timestamp - a.timestamp);
    } catch (err) {
      console.error('Failed to parse detection history from LocalStorage:', err);
      return [];
    }
  }

  async saveDetection(item: Omit<HistoryItem, 'id' | 'timestamp' | 'status' | 'notes'>): Promise<HistoryItem> {
    const history = await this.getAllDetections();
    
    const newItem: HistoryItem = {
      ...item,
      id: `det_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      status: 'active',
      notes: '',
    };

    history.push(newItem);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(history));
    return newItem;
  }

  async deleteDetection(id: string): Promise<void> {
    const history = await this.getAllDetections();
    const filtered = history.filter((item) => item.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
  }

  async clearHistory(): Promise<void> {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }

  async updateDetection(id: string, updates: Partial<HistoryItem>): Promise<HistoryItem> {
    const history = await this.getAllDetections();
    const index = history.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error(`Detection item with ID ${id} not found.`);
    }

    const updatedItem = {
      ...history[index],
      ...updates,
    };

    history[index] = updatedItem;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(history));
    return updatedItem;
  }

  async getStatistics(): Promise<HistoryStats> {
    const history = await this.getAllDetections();
    const totalImages = history.length;

    let totalPotholes = 0;
    let totalManholes = 0;
    let sumConfidence = 0;
    let sumProcessingTime = 0;
    let highestSeverityCount = 0;
    let repairedCount = 0;

    let severityHigh = 0;
    let severityMedium = 0;
    let severityLow = 0;
    let severityNone = 0;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTodayMs = startOfToday.getTime();

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const startOfWeekMs = startOfWeek.getTime();

    let detectionsToday = 0;
    let detectionsThisWeek = 0;

    history.forEach((item) => {
      totalPotholes += item.summary.pothole_count;
      totalManholes += item.summary.manhole_count;
      sumConfidence += item.summary.average_confidence;
      sumProcessingTime += item.summary.processing_time_ms;

      const highestSev = item.summary.highest_severity.toLowerCase();
      if (highestSev === 'high') {
        highestSeverityCount++;
        severityHigh++;
      } else if (highestSev === 'medium') {
        severityMedium++;
      } else if (highestSev === 'low') {
        severityLow++;
      } else {
        severityNone++;
      }

      if (item.status === 'repaired') {
        repairedCount++;
      }

      if (item.timestamp >= startOfTodayMs) {
        detectionsToday++;
      }
      if (item.timestamp >= startOfWeekMs) {
        detectionsThisWeek++;
      }
    });

    const averageConfidence = totalImages > 0 ? sumConfidence / totalImages : 0;
    const averageProcessingTime = totalImages > 0 ? sumProcessingTime / totalImages : 0;
    const repairRate = totalImages > 0 ? (repairedCount / totalImages) * 100 : 0;

    return {
      totalImages,
      totalPotholes,
      totalManholes,
      averageConfidence,
      averageProcessingTime,
      highestSeverityCount,
      detectionsToday,
      detectionsThisWeek,
      repairRate,
      severityBreakdown: {
        high: severityHigh,
        medium: severityMedium,
        low: severityLow,
        none: severityNone,
      },
    };
  }
}

export const historyService = new LocalStorageHistoryRepository();

// Search items helper
export function searchDetections(items: HistoryItem[], query: string): HistoryItem[] {
  if (!query.trim()) return items;
  const q = query.toLowerCase().trim();

  return items.filter((item) => {
    const nameMatch = item.imageName.toLowerCase().includes(q);
    
    // Check Date match in local string representation
    const formattedDate = new Date(item.timestamp).toLocaleDateString();
    const formattedTime = new Date(item.timestamp).toLocaleTimeString();
    const dateMatch = formattedDate.includes(q) || formattedTime.toLowerCase().includes(q);

    // Check Class name matches inside detections list
    const classMatch = item.detections.some((d) => d.class_name.toLowerCase().includes(q));

    // Check Severity matches
    const severityMatch = 
      item.summary.highest_severity.toLowerCase().includes(q) ||
      item.detections.some((d) => d.severity.toLowerCase().includes(q));

    // Check Status matches
    const statusMatch = item.status.toLowerCase().includes(q);

    return nameMatch || dateMatch || classMatch || severityMatch || statusMatch;
  });
}

// Filter items helper
export function filterDetections(items: HistoryItem[], filters: HistoryFilters): HistoryItem[] {
  const now = Date.now();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayMs = startOfToday.getTime();

  const weekMs = now - 7 * 24 * 60 * 60 * 1000;
  const monthMs = now - 30 * 24 * 60 * 60 * 1000;

  return items.filter((item) => {
    // 1. Damage Type Filter
    if (filters.damageType === 'potholes' && item.summary.pothole_count === 0) {
      return false;
    }
    if (filters.damageType === 'manholes' && item.summary.manhole_count === 0) {
      return false;
    }
    if (filters.damageType === 'none' && item.summary.total_detections > 0) {
      return false;
    }

    // 2. Severity Filter
    if (filters.severity !== 'all') {
      const itemSev = item.summary.highest_severity.toLowerCase();
      if (itemSev !== filters.severity) {
        return false;
      }
    }

    // 3. Time Range Filter
    if (filters.timeRange === 'today' && item.timestamp < todayMs) {
      return false;
    }
    if (filters.timeRange === 'week' && item.timestamp < weekMs) {
      return false;
    }
    if (filters.timeRange === 'month' && item.timestamp < monthMs) {
      return false;
    }

    // 4. Confidence Threshold Slider Filter
    // Display items where at least one detection exceeds or equals threshold, OR items with 0 detections
    if (item.detections.length > 0) {
      const hasMatch = item.detections.some((d) => d.confidence >= filters.minConfidence);
      if (!hasMatch) return false;
    }

    return true;
  });
}

// Sort items helper
export function sortDetections(items: HistoryItem[], sortBy: SortOption): HistoryItem[] {
  // slice to avoid modifying source array references directly
  return items.slice().sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return b.timestamp - a.timestamp;
      case 'oldest':
        return a.timestamp - b.timestamp;
      case 'highest_confidence':
        return b.summary.average_confidence - a.summary.average_confidence;
      case 'lowest_confidence':
        return a.summary.average_confidence - b.summary.average_confidence;
      case 'most_detections':
        return b.summary.total_detections - a.summary.total_detections;
      case 'least_detections':
        return a.summary.total_detections - b.summary.total_detections;
      case 'fastest_processing':
        return a.summary.processing_time_ms - b.summary.processing_time_ms;
      case 'slowest_processing':
        return b.summary.processing_time_ms - a.summary.processing_time_ms;
      default:
        return b.timestamp - a.timestamp;
    }
  });
}

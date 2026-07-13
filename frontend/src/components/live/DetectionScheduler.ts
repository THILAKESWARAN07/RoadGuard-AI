export interface SchedulerConfig {
  video: HTMLVideoElement;
  interval: number; // target interval (e.g. 500ms)
  onFrame: (blob: Blob) => Promise<any>;
  onResult: (result: any, stats: { latency: number; inferenceTime: number }) => void;
  onError: (error: any) => void;
  onStatusChange: (status: 'detecting' | 'idle' | 'error') => void;
}

export class DetectionScheduler {
  private config: SchedulerConfig;
  private timer: number | null = null;
  private activeRequest = false;
  private isRunning = false;
  private canvas: HTMLCanvasElement;

  constructor(config: SchedulerConfig) {
    this.config = config;
    this.canvas = document.createElement('canvas');
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.scheduleNext(0); // Run first frame immediately
  }

  public stop() {
    this.isRunning = false;
    if (this.timer) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
    this.activeRequest = false;
  }

  private scheduleNext(delay: number) {
    if (!this.isRunning) return;
    if (this.timer) {
      window.clearTimeout(this.timer);
    }
    this.timer = window.setTimeout(() => {
      void this.tick();
    }, delay);
  }

  private async tick() {
    if (!this.isRunning) return;

    // Queue protection: skip tick if previous request is still running
    if (this.activeRequest) {
      this.scheduleNext(100);
      return;
    }

    const video = this.config.video;
    if (!video || video.paused || video.ended || video.readyState < 2) {
      this.scheduleNext(this.config.interval);
      return;
    }

    const start = performance.now();
    try {
      this.activeRequest = true;
      this.config.onStatusChange('detecting');

      const blob = await this.captureFrame(video);
      if (!blob) {
        this.activeRequest = false;
        this.config.onStatusChange('idle');
        this.scheduleNext(this.config.interval);
        return;
      }

      const result = await this.config.onFrame(blob);
      const elapsed = performance.now() - start;

      const inferenceTime = result.summary?.processing_time_ms || 0;
      this.config.onResult(result, { latency: elapsed, inferenceTime });
      this.config.onStatusChange('idle');

      // Adaptive Delay calculations
      const delay = Math.max(100, this.config.interval - elapsed);
      this.activeRequest = false;
      this.scheduleNext(delay);
    } catch (err) {
      const elapsed = performance.now() - start;
      this.config.onError(err);
      this.config.onStatusChange('error');

      const delay = Math.max(100, this.config.interval - elapsed);
      this.activeRequest = false;
      this.scheduleNext(delay);
    }
  }

  private captureFrame(video: HTMLVideoElement): Promise<Blob | null> {
    return new Promise((resolve) => {
      const originalWidth = video.videoWidth;
      const originalHeight = video.videoHeight;
      if (originalWidth === 0 || originalHeight === 0) {
        resolve(null);
        return;
      }

      // Resize logic: downscale to maximum width 960px preserving aspect ratio
      const maxWidth = 960;
      let targetWidth = originalWidth;
      let targetHeight = originalHeight;

      if (originalWidth > maxWidth) {
        const ratio = maxWidth / originalWidth;
        targetWidth = maxWidth;
        targetHeight = Math.round(originalHeight * ratio);
      }

      this.canvas.width = targetWidth;
      this.canvas.height = targetHeight;
      
      const ctx = this.canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      // Draw flipped video frame onto canvas to matching final mirrored transforms if required?
      // Wait, let's keep canvas drawing normal to match API expected shapes (non-mirrored)
      ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
      this.canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.80);
    });
  }
}

export type PerformanceProfile = 'eco' | 'balanced' | 'extreme';
export type DecoderMode = 'hw' | 'sw';
export type AspectRatio = 'fit' | 'stretch' | 'zoom' | '16-9' | '4-3' | '21-9';

export interface SubtitleStyle {
  fontFamily: string;
  fontSize: number; // in px or rem equivalent
  textColor: string;
  shadowColor: string;
  backgroundColor: string; // background banner color
  backgroundOpacity: number; // 0 to 1
  verticalOffset: number; // offset from bottom in % or px
  isBold: boolean;
  shadowBlur: number;
}

export interface SubtitleItem {
  id: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  text: string;
}

export interface PlaybackFile {
  name: string;
  url: string;
  extension: string;
  isExample: boolean;
  duration?: number;
  sizeMB?: number;
  thumbnailUrl?: string;
  folder?: string;
}

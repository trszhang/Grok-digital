export interface Viseme {
  time: number;
  char: string;
  duration: number;
}

export interface WebSocketMessage {
  type: 'text' | 'audio' | 'status' | 'transcription';
  content?: string;
  payload?: string; // Base64 Audio
  visemes?: {
    characters: string[];
    character_start_times_seconds: number[];
  };
}
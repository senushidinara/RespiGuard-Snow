export interface EnvironmentalMetrics {
  temperature: number; // Celsius
  humidity: number; // %
  pm25: number; // µg/m³
  snowDepth: number; // cm
  coLevel: number; // ppm (Carbon Monoxide)
}

export interface HealthMetrics {
  heartRate: number; // bpm
  spO2: number; // %
  respiratoryRate: number; // breaths/min
  bodyTemp: number; // Celsius
}

export interface SystemSnapshot {
  timestamp: number;
  env: EnvironmentalMetrics;
  health: HealthMetrics;
}

export enum RiskLevel {
  LOW = "Low",
  MODERATE = "Moderate",
  HIGH = "High",
  CRITICAL = "Critical"
}

export interface AIAnalysisResult {
  riskLevel: RiskLevel;
  summary: string;
  recommendations: string[];
  weatherContext: string;
}

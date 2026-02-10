
export type Language = 'en' | 'ar';

export enum AssetType {
  MOTOR = 'MOTOR',
  PUMP = 'PUMP',
  GENERATOR = 'GENERATOR',
  TRANSFORMER = 'TRANSFORMER',
  UPS = 'UPS',
  ELECTRICAL_PANEL = 'ELECTRICAL_PANEL'
}

export enum Criticality {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum EventType {
  INSPECTION = 'INSPECTION',
  PREVENTIVE = 'PREVENTIVE',
  CORRECTIVE = 'CORRECTIVE',
  BREAKDOWN = 'BREAKDOWN',
  LUBRICATION = 'LUBRICATION',
  METER_READING = 'METER_READING',
  METER_REPLACEMENT = 'METER_REPLACEMENT'
}

export interface AssetSpecs {
  powerRatingKW?: number;
  voltageV?: number;
  currentA?: number;
  rpm?: number;
  bearingDE?: string;
  bearingNDE?: string;
  insulationClass?: string;
  ipRating?: string;
  lubricationIntervalHours?: number;
}

export interface MeterHistoryEntry {
  date: string;
  finalReadingOld: number;
  initialReadingNew: number;
  accumulatedAtSwap: number;
}

export interface Asset {
  id: string;
  tag: string;
  type: AssetType;
  location: string;
  manufacturer: string;
  model: string;
  criticality: Criticality;
  lastReading?: number;
  totalRunningHours: number;
  specs: AssetSpecs;
  status: 'OPERATIONAL' | 'WARNING' | 'DOWN';
  photoUrl?: string;
  lastMeterReplacementDate?: string;
  baseHoursOffset: number;
  meterHistory: MeterHistoryEntry[];
}

export interface MaintenanceEvent {
  id: string;
  assetId: string;
  date: string;
  type: EventType;
  description: string;
  technicianNotes?: string;
  readingAtEvent?: number;
  confidenceScore?: number;
  linkedEvidenceId?: string;
}

export interface WhatsAppEvidence {
  id: string;
  rawText: string;
  photos: string[]; // Base64 strings
  voiceTranscript?: string;
  timestamp: string;
  sender: string;
  status: 'PENDING' | 'PROCESSED' | 'DRAFT';
}

export interface ParsedWhatsAppMessage {
  assets_detected: string[];
  actions: string[];
  issues: string[];
  shift: 'A' | 'B' | 'C' | 'D';
  confidence: 'low' | 'medium' | 'high';
}

export interface PhotoCorrelationResult {
  photo_asset_links: Record<string, string>; // photo_index: asset_tag
  visible_issues: string[];
  missing_angles: string[];
}

export interface StructuredAssetEvent {
  asset: string;
  event_type: EventType;
  description: string;
  status: 'تم' | 'جاري' | 'مشكلة';
  follow_up: string;
  confidence: 'low' | 'medium' | 'high';
}

export interface AIAnalysisResult {
  extracted_data: {
    powerRating?: number;
    voltage?: number;
    current?: number;
    speed?: number;
    insulationClass?: string;
    ipRating?: string;
    manufacturer?: string;
    model?: string;
  };
  assumptions: string[];
  confidence_levels: Array<{ field: string; level: number }>;
  warnings: string[];
  recommended_actions: string[];
}

export interface HourMeterAnalysisResult {
  validated_reading: number;
  accumulated_hours: number;
  anomalies: string[];
  corrective_actions: string[];
  confidence_level: 'ESTIMATED' | 'PARTIAL' | 'CONFIRMED';
  plausibility_check: string;
}

export interface MeterReplacementAnalysis {
  baseline_locked: number;
  new_offset: number;
  accumulated_total: number;
  warnings: string[];
  explanation: string;
}

export interface MaintenanceEventAnalysis {
  classified_action: string;
  affected_components: string[];
  implied_actions: string[];
  clarifications: string[];
  structured_summary: string;
}

export interface MotorHealthAssessment {
  bearing_risk: { level: 'LOW' | 'MEDIUM' | 'HIGH'; details: string };
  insulation_risk: { level: 'LOW' | 'MEDIUM' | 'HIGH'; details: string };
  cooling_effectiveness: { score: number; details: string };
  risk_ranking: Array<{ component: string; risk: 'LOW' | 'MEDIUM' | 'HIGH' }>;
  recommendations: Array<{ action: string; urgency: 'ROUTINE' | 'URGENT' | 'IMMEDIATE' }>;
  safety_concerns: string[];
}

export interface LubricationAssessment {
  recommended_interval_hours: number;
  risk_assessment: {
    over_greasing: { level: 'LOW' | 'MEDIUM' | 'HIGH'; details: string };
    under_greasing: { level: 'LOW' | 'MEDIUM' | 'HIGH'; details: string };
  };
  primary_recommendation: string;
  detailed_actions: string[];
  confidence_level: number;
  unknown_fields: string[];
}

export interface BreakdownAnalysis {
  failure_causes: Array<{ cause: string; probability: number; rationale: string }>;
  immediate_checks: Array<{ check: string; safety_note: string }>;
  loto_isolation_steps: string[];
  recommended_actions: string[];
  escalation_criteria: string[];
}

export interface OperationalRiskAnalysis {
  risk_score: number;
  risk_drivers: Array<{ driver: string; impact: string }>;
  mitigation_actions: string[];
  priority_recommendation: string;
  reasoning: string;
}

export interface VisualInspectionAnalysis {
  defects: Array<{
    finding: string;
    type: 'COSMETIC' | 'FUNCTIONAL';
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    observation: string;
  }>;
  follow_up_inspections: string[];
  suspected_failure_modes: string[];
  summary: string;
}

export interface CMMSMigrationRecord {
  functional_location: string;
  equipment_category: string;
  standard_description: string;
  normalized_specs: Array<{ attr: string; val: string }>;
  data_integrity_flags: Array<{ field: string; issue: string; confidence: number }>;
  migration_readiness_score: number;
  json_payload: string;
}

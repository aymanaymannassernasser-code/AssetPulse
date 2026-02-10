
import { GoogleGenAI, Type } from "@google/genai";
import { 
  WhatsAppEvidence,
  ParsedWhatsAppMessage,
  PhotoCorrelationResult,
  StructuredAssetEvent,
  Language,
  EventType,
  AIAnalysisResult,
  HourMeterAnalysisResult,
  MeterReplacementAnalysis,
  MaintenanceEventAnalysis,
  LubricationAssessment,
  MotorHealthAssessment,
  BreakdownAnalysis,
  OperationalRiskAnalysis,
  VisualInspectionAnalysis,
  CMMSMigrationRecord,
  Asset
} from "./types";

const getSystemInstruction = (lang: Language) => `You are an industrial reliability engineer specialist. 
You detect asset tags (e.g. M-301), maintenance actions (e.g. Lubrication), and issues (e.g. Noise) from messy field data. 
You support both English and Arabic (slang and dialects included). 
Technical terms like 'Bearing' or 'Tag' are standard.`;

// STAGE 1: WhatsApp Message Parser
export const parseWhatsAppMessage = async (evidence: WhatsAppEvidence, lang: Language): Promise<ParsedWhatsAppMessage> => {
  // Fresh instance for each call to ensure correct API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';
  const response = await ai.models.generateContent({
    model,
    contents: `Raw Text: ${evidence.rawText}
    Voice Transcript: ${evidence.voiceTranscript || 'None'}
    Timestamp: ${evidence.timestamp}
    Detect asset tags, actions, status, and shift (A/B/C/D) based on time.
    Ignore greetings or jokes. Respond ONLY in valid JSON.`,
    config: {
      systemInstruction: getSystemInstruction(lang),
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          assets_detected: { type: Type.ARRAY, items: { type: Type.STRING } },
          actions: { type: Type.ARRAY, items: { type: Type.STRING } },
          issues: { type: Type.ARRAY, items: { type: Type.STRING } },
          shift: { type: Type.STRING, enum: ['A', 'B', 'C', 'D'] },
          confidence: { type: Type.STRING, enum: ['low', 'medium', 'high'] }
        },
        required: ["assets_detected", "actions", "issues", "shift", "confidence"]
      }
    }
  });
  return JSON.parse(response.text);
};

// STAGE 2: Photo Evidence Correlation
export const correlateEvidencePhotos = async (evidence: WhatsAppEvidence, parsed: ParsedWhatsAppMessage, lang: Language): Promise<PhotoCorrelationResult> => {
  // Fresh instance for gemini-3-pro-image-preview as per mandatory billing requirement
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-pro-image-preview'; 
  const parts: any[] = [
    { text: `Parsed Data: ${JSON.stringify(parsed)}. Link these photos to the detected assets. Detect oil leaks, burn marks, dust, or open panels.` }
  ];
  
  evidence.photos.forEach((base64) => {
    parts.push({ inlineData: { data: base64, mimeType: 'image/jpeg' } });
  });

  const response = await ai.models.generateContent({
    model,
    contents: { parts },
    config: {
      systemInstruction: getSystemInstruction(lang),
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          photo_asset_links: { type: Type.OBJECT, additionalProperties: { type: Type.STRING } },
          visible_issues: { type: Type.ARRAY, items: { type: Type.STRING } },
          missing_angles: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["photo_asset_links", "visible_issues", "missing_angles"]
      }
    }
  });
  return JSON.parse(response.text);
};

// STAGE 3: Maintenance Event Structuring
export const structureMaintenanceEvents = async (parsed: ParsedWhatsAppMessage, correlation: PhotoCorrelationResult, lang: Language): Promise<StructuredAssetEvent[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';
  const response = await ai.models.generateContent({
    model,
    contents: `Structure individual maintenance events for these assets: ${parsed.assets_detected.join(', ')}. 
    Actions observed: ${parsed.actions.join(', ')}. 
    Visual issues: ${correlation.visible_issues.join(', ')}. 
    Create one entry per asset. Respond ONLY in valid JSON array.`,
    config: {
      systemInstruction: getSystemInstruction(lang),
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            asset: { type: Type.STRING },
            event_type: { type: Type.STRING, enum: Object.values(EventType) },
            description: { type: Type.STRING },
            status: { type: Type.STRING, enum: ['تم', 'جاري', 'مشكلة'] },
            follow_up: { type: Type.STRING },
            confidence: { type: Type.STRING, enum: ['low', 'medium', 'high'] }
          },
          required: ["asset", "event_type", "description", "status", "follow_up", "confidence"]
        }
      }
    }
  });
  return JSON.parse(response.text);
};

// STAGE 4: Shift Log Generation
export const generateShiftLog = async (events: StructuredAssetEvent[], shift: string, lang: Language): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-pro-preview';
  const response = await ai.models.generateContent({
    model,
    contents: `Generate a professional Shift Log in Arabic for Shift ${shift}. 
    Summarize these events: ${JSON.stringify(events)}. 
    Use the 📋 format. Be concise and technical.`,
    config: {
      systemInstruction: `You are a plant supervisor generating shift reports. 
      Use clear Modern Standard Arabic. Use bullet points. 
      Format: 📋 تقرير شيفت [Shift]...`
    }
  });
  return response.text;
};

// RELIABILITY ANALYTICS: Hour meter validation
export const calculateAccumulatedHours = async (asset: Asset, newReading: number, lang: Language): Promise<HourMeterAnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Asset: ${asset.tag}. Previous Reading: ${asset.lastReading}. New Reading: ${newReading}. Offset: ${asset.baseHoursOffset}. Validate and calculate accumulated total.`,
    config: {
      systemInstruction: getSystemInstruction(lang),
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          validated_reading: { type: Type.NUMBER },
          accumulated_hours: { type: Type.NUMBER },
          anomalies: { type: Type.ARRAY, items: { type: Type.STRING } },
          corrective_actions: { type: Type.ARRAY, items: { type: Type.STRING } },
          confidence_level: { type: Type.STRING, enum: ['ESTIMATED', 'PARTIAL', 'CONFIRMED'] },
          plausibility_check: { type: Type.STRING }
        },
        required: ["validated_reading", "accumulated_hours", "anomalies", "corrective_actions", "confidence_level", "plausibility_check"]
      }
    }
  });
  return JSON.parse(response.text);
};

// RELIABILITY ANALYTICS: Meter swap logic
export const analyzeMeterReplacement = async (asset: Asset, oldFinal: number, newInitial: number, lang: Language): Promise<MeterReplacementAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Meter replacement for asset ${asset.tag}. Old meter final reading: ${oldFinal}. New meter initial reading: ${newInitial}. Current baseline offset: ${asset.baseHoursOffset}. Calculate updated total and offset.`,
    config: {
      systemInstruction: getSystemInstruction(lang),
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          baseline_locked: { type: Type.NUMBER },
          new_offset: { type: Type.NUMBER },
          accumulated_total: { type: Type.NUMBER },
          warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
          explanation: { type: Type.STRING }
        },
        required: ["baseline_locked", "new_offset", "accumulated_total", "warnings", "explanation"]
      }
    }
  });
  return JSON.parse(response.text);
};

// RELIABILITY ANALYTICS: Maintenance action classification
export const analyzeMaintenanceEvent = async (description: string, lang: Language): Promise<MaintenanceEventAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Classify and analyze maintenance description: "${description}". Identify affected components and implied tasks.`,
    config: {
      systemInstruction: getSystemInstruction(lang),
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          classified_action: { type: Type.STRING },
          affected_components: { type: Type.ARRAY, items: { type: Type.STRING } },
          implied_actions: { type: Type.ARRAY, items: { type: Type.STRING } },
          clarifications: { type: Type.ARRAY, items: { type: Type.STRING } },
          structured_summary: { type: Type.STRING }
        },
        required: ["classified_action", "affected_components", "implied_actions", "clarifications", "structured_summary"]
      }
    }
  });
  return JSON.parse(response.text);
};

// RELIABILITY ANALYTICS: Lubrication scheduling
export const assessLubrication = async (asset: Asset, lang: Language): Promise<LubricationAssessment> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Assess lubrication requirement for ${asset.tag}. Asset specs: ${JSON.stringify(asset.specs)}. Current running hours: ${asset.totalRunningHours}.`,
    config: {
      systemInstruction: getSystemInstruction(lang),
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recommended_interval_hours: { type: Type.NUMBER },
          risk_assessment: {
            type: Type.OBJECT,
            properties: {
              over_greasing: {
                type: Type.OBJECT,
                properties: { level: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'] }, details: { type: Type.STRING } },
                required: ["level", "details"]
              },
              under_greasing: {
                type: Type.OBJECT,
                properties: { level: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'] }, details: { type: Type.STRING } },
                required: ["level", "details"]
              }
            },
            required: ["over_greasing", "under_greasing"]
          },
          primary_recommendation: { type: Type.STRING },
          detailed_actions: { type: Type.ARRAY, items: { type: Type.STRING } },
          confidence_level: { type: Type.NUMBER },
          unknown_fields: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["recommended_interval_hours", "risk_assessment", "primary_recommendation", "detailed_actions", "confidence_level", "unknown_fields"]
      }
    }
  });
  return JSON.parse(response.text);
};

// FIELD DATA RECONSTRUCTION: Extract data from nameplate images
export const extractNameplateData = async (base64Image: string, lang: Language): Promise<AIAnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-pro-image-preview';
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { text: "Read this industrial nameplate and extract technical specs: Power (kW), Voltage (V), Current (A), Speed (RPM), Insulation, IP Rating, Manufacturer, Model." },
        { inlineData: { data: base64Image, mimeType: 'image/jpeg' } }
      ]
    },
    config: {
      systemInstruction: getSystemInstruction(lang),
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          extracted_data: {
            type: Type.OBJECT,
            properties: {
              powerRating: { type: Type.NUMBER },
              voltage: { type: Type.NUMBER },
              current: { type: Type.NUMBER },
              speed: { type: Type.NUMBER },
              insulationClass: { type: Type.STRING },
              ipRating: { type: Type.STRING },
              manufacturer: { type: Type.STRING },
              model: { type: Type.STRING }
            }
          },
          assumptions: { type: Type.ARRAY, items: { type: Type.STRING } },
          confidence_levels: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { field: { type: Type.STRING }, level: { type: Type.NUMBER } },
              required: ["field", "level"]
            }
          },
          warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommended_actions: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["extracted_data", "assumptions", "confidence_levels", "warnings", "recommended_actions"]
      }
    }
  });
  return JSON.parse(response.text);
};

// FIELD DATA RECONSTRUCTION: Infer asset details from minimal input
export const inferAssetFromMinimalData = async (tag: string, category: string, location: string, lang: Language): Promise<AIAnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Incomplete asset record: Tag ${tag}, Category ${category}, Location ${location}. Reconstruct missing specs based on typical plant configurations.`,
    config: {
      systemInstruction: getSystemInstruction(lang),
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          extracted_data: {
            type: Type.OBJECT,
            properties: { manufacturer: { type: Type.STRING }, model: { type: Type.STRING }, powerRating: { type: Type.NUMBER } }
          },
          assumptions: { type: Type.ARRAY, items: { type: Type.STRING } },
          confidence_levels: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { field: { type: Type.STRING }, level: { type: Type.NUMBER } },
              required: ["field", "level"]
            }
          },
          warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommended_actions: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["extracted_data", "assumptions", "confidence_levels", "warnings", "recommended_actions"]
      }
    }
  });
  return JSON.parse(response.text);
};

// DIAGNOSIS & TROUBLESHOOTING: General maintenance advice
export const getMaintenanceAdvice = async (tag: string, history: string, issue: string, lang: Language): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Reliability request for ${tag}. Historical context: ${history}. Symptom reported: ${issue}. Provide engineering recommendations.`,
    config: { systemInstruction: getSystemInstruction(lang) }
  });
  return response.text;
};

// DIAGNOSIS & TROUBLESHOOTING: Specialized motor health analysis
export const assessMotorHealth = async (asset: Asset, issue: string, lang: Language): Promise<MotorHealthAssessment> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Technical health assessment for motor ${asset.tag}. Reported issue: ${issue}. Specs: ${JSON.stringify(asset.specs)}.`,
    config: {
      systemInstruction: getSystemInstruction(lang),
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          bearing_risk: { type: Type.OBJECT, properties: { level: { type: Type.STRING }, details: { type: Type.STRING } }, required: ["level", "details"] },
          insulation_risk: { type: Type.OBJECT, properties: { level: { type: Type.STRING }, details: { type: Type.STRING } }, required: ["level", "details"] },
          cooling_effectiveness: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, details: { type: Type.STRING } }, required: ["score", "details"] },
          risk_ranking: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { component: { type: Type.STRING }, risk: { type: Type.STRING } } } },
          recommendations: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { action: { type: Type.STRING }, urgency: { type: Type.STRING } } } },
          safety_concerns: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["bearing_risk", "insulation_risk", "cooling_effectiveness", "risk_ranking", "recommendations", "safety_concerns"]
      }
    }
  });
  return JSON.parse(response.text);
};

// DIAGNOSIS & TROUBLESHOOTING: RCA and Breakdown response
export const troubleshootBreakdown = async (asset: Asset, issue: string, cond: string, acts: string, lang: Language): Promise<BreakdownAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `BREAKDOWN EMERGENCY: Asset ${asset.tag}. Symptom: ${issue}. Operational condition: ${cond}. Immediate acts performed: ${acts}. Provide RCA and LOTO steps.`,
    config: {
      systemInstruction: getSystemInstruction(lang),
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          failure_causes: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { cause: { type: Type.STRING }, probability: { type: Type.NUMBER }, rationale: { type: Type.STRING } } } },
          immediate_checks: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { check: { type: Type.STRING }, safety_note: { type: Type.STRING } } } },
          loto_isolation_steps: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommended_actions: { type: Type.ARRAY, items: { type: Type.STRING } },
          escalation_criteria: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["failure_causes", "immediate_checks", "loto_isolation_steps", "recommended_actions", "escalation_criteria"]
      }
    }
  });
  return JSON.parse(response.text);
};

// DATA MIGRATION: Standardize asset data for CMMS export
export const prepareMigrationData = async (asset: Asset, events: any[], lang: Language): Promise<CMMSMigrationRecord> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Convert local asset record ${asset.tag} to standard CMMS format. Registry data: ${JSON.stringify(asset)}. Event log: ${JSON.stringify(events)}.`,
    config: {
      systemInstruction: getSystemInstruction(lang),
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          functional_location: { type: Type.STRING },
          equipment_category: { type: Type.STRING },
          standard_description: { type: Type.STRING },
          normalized_specs: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { attr: { type: Type.STRING }, val: { type: Type.STRING } } } },
          data_integrity_flags: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { field: { type: Type.STRING }, issue: { type: Type.STRING }, confidence: { type: Type.NUMBER } } } },
          migration_readiness_score: { type: Type.NUMBER },
          json_payload: { type: Type.STRING }
        },
        required: ["functional_location", "equipment_category", "standard_description", "normalized_specs", "data_integrity_flags", "migration_readiness_score", "json_payload"]
      }
    }
  });
  return JSON.parse(response.text);
};

// RELIABILITY ANALYTICS: Operational risk assessment
export const calculateOperationalRisk = async (asset: Asset, unc: string, deg: string, lang: Language): Promise<OperationalRiskAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Calculate risk score for ${asset.tag}. Observed uncertainties: ${unc}. Visible degradation: ${deg}. Factor in criticality: ${asset.criticality}.`,
    config: {
      systemInstruction: getSystemInstruction(lang),
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          risk_score: { type: Type.NUMBER },
          risk_drivers: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { driver: { type: Type.STRING }, impact: { type: Type.STRING } } } },
          mitigation_actions: { type: Type.ARRAY, items: { type: Type.STRING } },
          priority_recommendation: { type: Type.STRING },
          reasoning: { type: Type.STRING }
        },
        required: ["risk_score", "risk_drivers", "mitigation_actions", "priority_recommendation", "reasoning"]
      }
    }
  });
  return JSON.parse(response.text);
};

// FIELD INSPECTION: Visual defect analysis from photos
export const analyzeFieldPhoto = async (base64: string, lang: Language): Promise<VisualInspectionAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-pro-image-preview';
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { text: "Conduct an engineering visual inspection on this equipment photo. Look for corrosion, leakage, misalignment, thermal damage, or loose mounting." },
        { inlineData: { data: base64, mimeType: 'image/jpeg' } }
      ]
    },
    config: {
      systemInstruction: getSystemInstruction(lang),
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          defects: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                finding: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['COSMETIC', 'FUNCTIONAL'] },
                severity: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'] },
                observation: { type: Type.STRING }
              },
              required: ["finding", "type", "severity", "observation"]
            }
          },
          follow_up_inspections: { type: Type.ARRAY, items: { type: Type.STRING } },
          suspected_failure_modes: { type: Type.ARRAY, items: { type: Type.STRING } },
          summary: { type: Type.STRING }
        },
        required: ["defects", "follow_up_inspections", "suspected_failure_modes", "summary"]
      }
    }
  });
  return JSON.parse(response.text);
};

import { GoogleGenAI, Type } from "@google/genai";
import { SystemSnapshot, AIAnalysisResult, RiskLevel } from "../types";

const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.API_KEY || "";

// Initialize the client only if API key is available
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey: apiKey });
}

// Mock analysis based on environmental and health metrics
const generateMockAnalysis = (snapshot: SystemSnapshot): AIAnalysisResult => {
  const { env, health } = snapshot;

  // Calculate risk factors
  const tempFactor = env.temperature < -10 ? 2 : env.temperature < 0 ? 1.5 : 1;
  const pm25Factor = env.pm25 > 35 ? 2 : env.pm25 > 25 ? 1.5 : 1;
  const spO2Factor = health.spO2 < 95 ? 2 : health.spO2 < 97 ? 1.5 : 1;
  const hrFactor = health.heartRate > 100 ? 1.5 : 1;

  const riskScore = tempFactor * 0.3 + pm25Factor * 0.3 + spO2Factor * 0.2 + hrFactor * 0.2;

  // Determine risk level
  let riskLevel: RiskLevel;
  if (riskScore >= 3) {
    riskLevel = RiskLevel.CRITICAL;
  } else if (riskScore >= 2.2) {
    riskLevel = RiskLevel.HIGH;
  } else if (riskScore >= 1.5) {
    riskLevel = RiskLevel.MODERATE;
  } else {
    riskLevel = RiskLevel.LOW;
  }

  // Generate context-aware summary and recommendations
  let summary = "";
  let recommendations: string[] = [];
  let weatherContext = "";

  if (env.temperature < -10) {
    weatherContext = "Severe Cold Snap - Dangerous wind chills increase bronchospasm risk";
    if (riskLevel === RiskLevel.CRITICAL || riskLevel === RiskLevel.HIGH) {
      summary = "Critical conditions detected. Extreme cold and elevated pollutants create significant respiratory stress.";
      recommendations = [
        "Avoid outdoor exposure immediately. Use heated, filtered indoor spaces only.",
        "Pre-medicate with rescue inhaler 15 minutes before any necessary outdoor activity.",
        "Wear a cold-air mask or balaclava to warm inhaled air."
      ];
    } else {
      summary = "Severe cold air is present. Use protective measures for any outdoor activity.";
      recommendations = [
        "Limit outdoor exertion to short durations only.",
        "Wear insulated, breathable cold-weather gear and cover nose/mouth.",
        "Keep your rescue inhaler easily accessible."
      ];
    }
  } else if (env.pm25 > 35) {
    weatherContext = "High Particulate Matter - Air quality hazardous for respiratory conditions";
    if (riskLevel === RiskLevel.HIGH || riskLevel === RiskLevel.CRITICAL) {
      summary = "Hazardous air quality detected. Particulate matter levels exceed safe thresholds for asthma.";
      recommendations = [
        "Stay indoors with HEPA air filtration running.",
        "Use N95 mask if outdoor exposure is unavoidable.",
        "Monitor vitals closely and have emergency contact information ready."
      ];
    } else {
      summary = "Air quality is degraded. Minimize outdoor activity and use protective equipment.";
      recommendations = [
        "Reduce outdoor exposure and physical exertion.",
        "Use an air purifier indoors to maintain clean air.",
        "Wear an N95 mask if you must go outside."
      ];
    }
  } else if (health.spO2 < 95) {
    weatherContext = "Hypoxemia Detected - Oxygen saturation is below normal range";
    summary = "Low oxygen saturation requires immediate medical attention. Current conditions may be contributing.";
    recommendations = [
      "Seek medical evaluation urgently if SpO2 remains below 94%.",
      "Sit upright to improve breathing mechanics.",
      "Use supplemental oxygen if prescribed and available."
    ];
  } else if (env.temperature < 0 && env.pm25 > 20) {
    weatherContext = "Winter Inversion Layer - Cold temperatures trap pollutants near ground level";
    summary = "Winter conditions combining cold air and moderate pollution. Increased respiratory caution advised.";
    recommendations = [
      "Wear a scarf or mask over your nose and mouth to pre-warm air.",
      "Keep your rescue inhaler accessible at all times.",
      "Limit strenuous outdoor activities during peak pollution hours."
    ];
  } else if (env.snowDepth > 10 && health.heartRate > 100) {
    weatherContext = "Snowy Conditions with Elevated Heart Rate - Physical exertion in winter";
    summary = "Your heart is working hard in cold weather. Monitor closely and take frequent rest breaks.";
    recommendations = [
      "Reduce physical exertion intensity in snow conditions.",
      "Allow extra recovery time between activities.",
      "Stay well-hydrated and maintain warm body temperature."
    ];
  } else {
    weatherContext = "Stable Winter Conditions - Monitor vitals regularly";
    summary = "Current environmental and vital signs are within acceptable ranges for respiratory health.";
    recommendations = [
      "Continue regular monitoring of all vitals.",
      "Maintain good indoor air quality and humidity levels.",
      "Stay prepared with medications for sudden weather changes."
    ];
  }

  return {
    riskLevel,
    summary,
    recommendations,
    weatherContext
  };
};

export const analyzeRespiratoryRisk = async (
  snapshot: SystemSnapshot
): Promise<AIAnalysisResult> => {
  // If no API key, use mock analysis
  if (!apiKey) {
    return generateMockAnalysis(snapshot);
  }

  const prompt = `
    Analyze the following data from a respiratory health monitoring system in a snowy winter environment.

    Environmental Conditions:
    - Temperature: ${snapshot.env.temperature.toFixed(1)}°C
    - Humidity: ${snapshot.env.humidity.toFixed(1)}%
    - PM2.5: ${snapshot.env.pm25.toFixed(1)} µg/m³
    - Snow Depth: ${snapshot.env.snowDepth.toFixed(1)} cm

    User Vitals:
    - Heart Rate: ${snapshot.health.heartRate} bpm
    - SpO2: ${snapshot.health.spO2}%
    - Respiratory Rate: ${snapshot.health.respiratoryRate} bpm
    - Body Temp: ${snapshot.health.bodyTemp.toFixed(1)}°C

    Context: Cold air and high particulate matter (PM2.5) in winter are major triggers for bronchospasm and asthma.
    Provide a JSON response assessing the respiratory risk.
  `;

  try {
    if (!ai) {
      throw new Error("AI client not initialized");
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: {
              type: Type.STRING,
              enum: ["Low", "Moderate", "High", "Critical"],
              description: "The assessed level of respiratory risk."
            },
            summary: {
              type: Type.STRING,
              description: "A brief 1-2 sentence summary of the current health situation."
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of 3 actionable recommendations."
            },
            weatherContext: {
              type: Type.STRING,
              description: "Brief observation about the weather impact (e.g., 'Cold Snap', 'Inversion Layer')."
            }
          },
          required: ["riskLevel", "summary", "recommendations", "weatherContext"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const data = JSON.parse(text);

    // Map string to Enum safely
    let mappedRisk = RiskLevel.LOW;
    switch(data.riskLevel) {
        case "Moderate": mappedRisk = RiskLevel.MODERATE; break;
        case "High": mappedRisk = RiskLevel.HIGH; break;
        case "Critical": mappedRisk = RiskLevel.CRITICAL; break;
        default: mappedRisk = RiskLevel.LOW;
    }

    return {
      riskLevel: mappedRisk,
      summary: data.summary,
      recommendations: data.recommendations,
      weatherContext: data.weatherContext
    };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Fallback to mock analysis on error
    return generateMockAnalysis(snapshot);
  }
};

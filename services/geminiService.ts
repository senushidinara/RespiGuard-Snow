import { GoogleGenAI, Type } from "@google/genai";
import { SystemSnapshot, AIAnalysisResult, RiskLevel } from "../types";

const apiKey = process.env.API_KEY || "";

// Initialize the client
// Note: In a real production app, ensure this is handled securely.
// Depending on framework, env vars might be accessed differently, keeping strict to instructions.
const ai = new GoogleGenAI({ apiKey: apiKey });

export const analyzeRespiratoryRisk = async (
  snapshot: SystemSnapshot
): Promise<AIAnalysisResult> => {
  if (!apiKey) {
    // Fallback for demo if no key is provided, simulating a response
    return {
      riskLevel: RiskLevel.MODERATE,
      summary: "API Key missing. Simulating analysis: Moderate risk due to low temperatures and elevated PM2.5 levels common in winter.",
      recommendations: [
        "Wear a scarf over your nose and mouth to warm the air.",
        "Keep your rescue inhaler accessible.",
        "Limit outdoor exertion."
      ],
      weatherContext: "Simulated Winter Conditions"
    };
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
    // Fallback on error
    return {
      riskLevel: RiskLevel.LOW,
      summary: "Analysis service temporarily unavailable.",
      recommendations: ["Monitor vitals manually.", "Stay warm."],
      weatherContext: "N/A"
    };
  }
};

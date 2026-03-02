
import { GoogleGenAI, Type } from "@google/genai";

// En Vite las variables de entorno del cliente deben comenzar con VITE_
const getApiKey = (): string | undefined => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) {
    return import.meta.env.VITE_GEMINI_API_KEY;
  }
  return undefined;
};

export const getSmartDiagnosis = async (device: string, brand: string, problem: string) => {
  const apiKey = getApiKey();

  if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
    console.warn("Gemini API Key no encontrada. Configura VITE_GEMINI_API_KEY en tu archivo .env.local");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Modelo correcto y estable: gemini-2.0-flash (Feb 2026)
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Analiza este reporte de avería técnica:
      Equipo: ${device}
      Marca: ${brand}
      Problema reportado: ${problem}`,
      config: {
        systemInstruction: "Eres un ingeniero senior de servicio técnico especializado en electrodomésticos y dispositivos electrónicos. Analiza fallos de forma profesional y genera un informe técnico en formato JSON con causas probables, repuestos estimados, tiempo estimado y consejos de seguridad. Responde SIEMPRE en español.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            possibleCauses: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Lista de causas técnicas probables"
            },
            suggestedParts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Repuestos necesarios para la reparación"
            },
            estimatedTime: {
              type: Type.STRING,
              description: "Tiempo estimado de intervención (ej: 2-3 horas)"
            },
            technicalAdvice: {
              type: Type.STRING,
              description: "Consejo de seguridad técnica para manipular el equipo"
            },
            difficultyLevel: {
              type: Type.STRING,
              description: "Nivel de dificultad: Básico, Intermedio o Avanzado"
            }
          },
          required: ["possibleCauses", "suggestedParts", "estimatedTime", "technicalAdvice", "difficultyLevel"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    const clean = text.trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
    return JSON.parse(clean);
  } catch (error) {
    console.error("Error en el servicio Gemini:", error);
    return null;
  }
};

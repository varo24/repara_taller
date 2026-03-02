
import { GoogleGenAI, Type } from "@google/genai";

export const getSmartDiagnosis = async (device: string, brand: string, problem: string) => {
  // Fix: Obtained API key exclusively from process.env.API_KEY as per coding guidelines
  if (!process.env.API_KEY) {
    console.warn("Gemini API Key no encontrada. El diagnóstico inteligente no estará disponible.");
    return null;
  }

  try {
    // Fix: Directly use process.env.API_KEY during initialization as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Fix: Use ai.models.generateContent with model and prompt in a single call
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Analiza este reporte de avería técnica:
      Equipo: ${device}
      Marca: ${brand}
      Problema reportado: ${problem}`,
      config: {
        // Fix: Use systemInstruction to define the persona and specific requirements
        systemInstruction: "Eres un ingeniero senior de servicio técnico especializado en electrodomésticos. Analiza fallos de forma profesional y genera un informe técnico en formato JSON que incluya causas probables, repuestos estimados y consejos de seguridad técnica.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            possibleCauses: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Lista de causas técnicas probables para el fallo reportado"
            },
            suggestedParts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Repuestos necesarios para realizar la reparación"
            },
            estimatedTime: {
              type: Type.STRING,
              description: "Tiempo estimado de intervención técnica (ej: 2h)"
            },
            technicalAdvice: {
              type: Type.STRING,
              description: "Consejo de seguridad técnica fundamental para la manipulación del equipo"
            }
          },
          required: ["possibleCauses", "suggestedParts", "estimatedTime", "technicalAdvice"]
        }
      }
    });

    // Fix: Accessed .text property directly as it is not a method
    const text = response.text;
    if (!text) return null;
    
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("Error en el servicio Gemini:", error);
    return null;
  }
};

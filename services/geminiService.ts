import { GoogleGenAI, Type } from '@google/genai';

export const getSmartDiagnosis = async (device: string, brand: string, problem: string) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('Gemini API Key no encontrada. El diagnóstico IA no estará disponible.');
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Analiza este reporte de avería técnica:
      Equipo: ${device}
      Marca: ${brand}
      Problema reportado: ${problem}`,
      config: {
        systemInstruction:
          'Eres un ingeniero senior de servicio técnico especializado en electrodomésticos. Analiza fallos de forma profesional y genera un informe técnico en formato JSON que incluya causas probables, repuestos estimados y consejos de seguridad técnica.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            possibleCauses: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Lista de causas técnicas probables para el fallo reportado',
            },
            suggestedParts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Repuestos necesarios para realizar la reparación',
            },
            estimatedTime: {
              type: Type.STRING,
              description: 'Tiempo estimado de intervención técnica (ej: 2h)',
            },
            technicalAdvice: {
              type: Type.STRING,
              description: 'Consejo de seguridad técnica fundamental para la manipulación del equipo',
            },
          },
          required: ['possibleCauses', 'suggestedParts', 'estimatedTime', 'technicalAdvice'],
        },
      },
    });

    const text = response.text;
    if (!text) return null;

    return JSON.parse(text.trim());
  } catch (error) {
    console.error('Error en el servicio Gemini:', error);
    return null;
  }
};

'use server';
/**
 * @fileOverview An AI agent for detecting and classifying waste from images.
 *
 * - aiWasteDetectionAndClassification - A function that handles the AI waste detection and classification process.
 * - AIWasteDetectionAndClassificationInput - The input type for the aiWasteDetectionAndClassification function.
 * - AIWasteDetectionAndClassificationOutput - The return type for the aiWasteDetectionAndClassification function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIWasteDetectionAndClassificationInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of waste, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AIWasteDetectionAndClassificationInput = z.infer<
  typeof AIWasteDetectionAndClassificationInputSchema
>;

const WasteTypeSchema = z.enum([
  'plastic',
  'organic',
  'electronic',
  'glass',
  'paper',
  'metal',
  'textile',
  'hazardous',
  'mixed',
  'unknown',
]);

const SeveritySchema = z.enum(['low', 'medium', 'high', 'critical']);

const AIWasteDetectionAndClassificationOutputSchema = z.object({
  wasteDetected: z.boolean().describe('Whether waste was detected in the image.'),
  wasteType: WasteTypeSchema.describe('The primary type of waste detected.').optional(),
  severity: SeveritySchema.describe('The severity of the waste detected.').optional(),
  analysisDetails: z
    .string()
    .describe(
      'A detailed description of the waste detected, its classification, and the reasoning for the severity assessment.'
    ),
});
export type AIWasteDetectionAndClassificationOutput = z.infer<
  typeof AIWasteDetectionAndClassificationOutputSchema
>;

export async function aiWasteDetectionAndClassification(
  input: AIWasteDetectionAndClassificationInput
): Promise<AIWasteDetectionAndClassificationOutput> {
  return aiWasteDetectionAndClassificationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiWasteDetectionAndClassificationPrompt',
  input: {schema: AIWasteDetectionAndClassificationInputSchema},
  output: {schema: AIWasteDetectionAndClassificationOutputSchema},
  prompt: `You are an expert environmental waste analyst for the city of Madurai. Your task is to analyze images of potential waste sites and provide a structured report.

Based on the provided image, perform the following analysis:
1. Determine if any waste is present. If no waste is detected, set 'wasteDetected' to false, and 'wasteType' and 'severity' to null.
2. If waste is detected, classify its primary type from the following categories: 'plastic', 'organic', 'electronic', 'glass', 'paper', 'metal', 'textile', 'hazardous', 'mixed', 'unknown'. If multiple types are present, choose the most predominant or impactful one.
3. Assess the severity of the waste situation as 'low', 'medium', 'high', or 'critical', considering factors like quantity, type, and potential environmental impact.
4. Provide a detailed explanation for your findings in 'analysisDetails', including specific observations that led to your waste type classification and severity assessment. If no waste is detected, explain why you reached that conclusion.

Image to analyze: {{media url=photoDataUri}}`,
});

const aiWasteDetectionAndClassificationFlow = ai.defineFlow(
  {
    name: 'aiWasteDetectionAndClassificationFlow',
    inputSchema: AIWasteDetectionAndClassificationInputSchema,
    outputSchema: AIWasteDetectionAndClassificationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

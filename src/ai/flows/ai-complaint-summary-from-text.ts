'use server';
/**
 * @fileOverview This file provides a Genkit flow to summarize and extract key details from a text waste complaint.
 *
 * - aiComplaintSummaryFromText - A function that processes a text complaint to generate a summary and key details.
 * - AIComplaintSummaryFromTextInput - The input type for the aiComplaintSummaryFromText function.
 * - AIComplaintSummaryFromTextOutput - The return type for the aiComplaintSummaryFromText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIComplaintSummaryFromTextInputSchema = z.object({
  complaintText: z.string().describe('The user provided text description of the waste complaint.'),
});
export type AIComplaintSummaryFromTextInput = z.infer<typeof AIComplaintSummaryFromTextInputSchema>;

const AIComplaintSummaryFromTextOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the waste complaint.'),
  keyDetails: z
    .array(z.string())
    .describe('A list of key details extracted from the complaint, such as location hints, types of waste, or severity.'),
});
export type AIComplaintSummaryFromTextOutput = z.infer<typeof AIComplaintSummaryFromTextOutputSchema>;

export async function aiComplaintSummaryFromText(
  input: AIComplaintSummaryFromTextInput
): Promise<AIComplaintSummaryFromTextOutput> {
  return aiComplaintSummaryFromTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiComplaintSummaryFromTextPrompt',
  input: {schema: AIComplaintSummaryFromTextInputSchema},
  output: {schema: AIComplaintSummaryFromTextOutputSchema},
  prompt: `You are an AI assistant designed to help process waste complaints.
Your task is to analyze the provided text description of a waste complaint, create a concise summary, and extract key details.

Complaint Description:
{{{complaintText}}}

Please provide the output in JSON format adhering to the defined schema.`,
});

const aiComplaintSummaryFromTextFlow = ai.defineFlow(
  {
    name: 'aiComplaintSummaryFromTextFlow',
    inputSchema: AIComplaintSummaryFromTextInputSchema,
    outputSchema: AIComplaintSummaryFromTextOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

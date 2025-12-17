'use server';
/**
 * @fileOverview Personalized feed generation using Genkit.
 *
 * - generatePersonalizedFeed - Generates a personalized feed for a user based on their followed communities and preferences.
 * - PersonalizedFeedInput - The input type for the generatePersonalizedFeed function.
 * - RankedContent - The return type for the generatePersonalizedFeed function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedFeedInputSchema = z.object({
  userPreferences: z.string().describe('A description of the users content preferences and past interactions'),
  communityPosts: z.record(z.array(z.string())).describe('A map of community names to a list of recent posts (text content only) in that community.'),
});
export type PersonalizedFeedInput = z.infer<typeof PersonalizedFeedInputSchema>;

const RankedContentSchema = z.array(
  z.object({
    community: z.string().describe('The community the content belongs to.'),
    post: z.string().describe('The content of the post.'),
    relevanceScore: z.number().describe('A score indicating the relevance of the content to the user.'),
  })
);
export type RankedContent = z.infer<typeof RankedContentSchema>;

export async function generatePersonalizedFeed(input: PersonalizedFeedInput): Promise<RankedContent> {
  return personalizedFeedFlow(input);
}

const rankContentPrompt = ai.definePrompt({
  name: 'rankContentPrompt',
  input: {schema: PersonalizedFeedInputSchema},
  output: {schema: RankedContentSchema},
  prompt: `You are an AI assistant designed to create personalized content feeds for users.

You will receive the user's content preferences and a list of recent posts from the communities they follow.
Your task is to rank these posts based on their relevance to the user's preferences and generate a personalized feed.

User Preferences: {{{userPreferences}}}

Community Posts:
{{#each communityPosts}}
  Community: {{@key}}
  Posts:
  {{#each this}}
    - {{{this}}}
  {{/each}}
{{/each}}

Rank the posts from all communities based on relevance to the user's preferences. Each post should be assigned a relevance score.
Output the ranked content as a JSON array of objects, including the community, post content, and relevance score.
`,
});

const personalizedFeedFlow = ai.defineFlow(
  {
    name: 'personalizedFeedFlow',
    inputSchema: PersonalizedFeedInputSchema,
    outputSchema: RankedContentSchema,
  },
  async input => {
    const {output} = await rankContentPrompt(input);
    return output!;
  }
);

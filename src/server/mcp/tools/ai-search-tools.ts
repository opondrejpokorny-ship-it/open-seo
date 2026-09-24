import { getBrandLookup } from "@/server/features/ai-search/services/brandLookup";
import { explorePrompt } from "@/server/features/ai-search/services/promptExplorer";
import { assertAiVisibilityAccess } from "@/server/features/ai-search/access";
import { buildProjectMeta } from "@/server/mcp/context";
import { mcpResponse } from "@/server/mcp/formatters";
import {
  looseObjectOutputSchema,
  optionalMetaOutputSchema,
} from "@/server/mcp/output-schemas";
import { withMcpProjectAuth } from "@/server/mcp/project-auth";
import {
  brandLookupInputSchema,
  promptExplorerInputSchema,
  type BrandLookupInput,
  type PromptExplorerInput,
} from "@/types/schemas/ai-search";

const aiSearchOutputSchema = looseObjectOutputSchema.extend(
  optionalMetaOutputSchema,
);

export const getAiBrandVisibilityTool = {
  name: "get_ai_brand_visibility",
  config: {
    title: "Get AI brand visibility",
    description:
      "Measure a brand/domain across ChatGPT and Google AI visibility, including mentions, AI search volume, cited pages, prompt examples, and optional competitor Share of Voice. Uses paid DataForSEO AI-search endpoints and may fan out to several requests.",
    inputSchema: brandLookupInputSchema,
    outputSchema: aiSearchOutputSchema,
    annotations: {
      readOnlyHint: false,
      openWorldHint: false,
      destructiveHint: false,
    },
  },
  handler: withMcpProjectAuth(async (args: BrandLookupInput, context) => {
    await assertAiVisibilityAccess(context.auth.organizationId);
    const result = await getBrandLookup(args, context.billing);
    const shareRows = result.shareOfVoice?.entries.length ?? 0;
    const text = [
      `AI visibility for ${result.resolvedTarget}: ${result.totalMentions ?? "?"} mentions`,
      `${result.topPages.length} cited pages; ${result.topQueries.length} prompt examples`,
      shareRows > 0 ? `${shareRows} Share-of-Voice rows` : null,
    ]
      .filter(Boolean)
      .join(". ");

    return mcpResponse({
      text,
      meta: buildProjectMeta(
        context,
        args.projectId,
        `/p/${args.projectId}/brand-lookup`,
        { q: args.query },
      ),
      structuredContent: result,
    });
  }),
};

export const exploreAiPromptTool = {
  name: "explore_ai_prompt",
  config: {
    title: "Explore AI prompt",
    description:
      "Run one prompt across selected ChatGPT, Claude, Gemini, or Perplexity models and return answers, citations, fan-out queries, and optional brand-mention detection. Uses paid DataForSEO LLM-response endpoints and can issue one paid request per selected model.",
    inputSchema: promptExplorerInputSchema,
    outputSchema: aiSearchOutputSchema,
    annotations: {
      readOnlyHint: false,
      openWorldHint: false,
      destructiveHint: false,
    },
  },
  handler: withMcpProjectAuth(async (args: PromptExplorerInput, context) => {
    await assertAiVisibilityAccess(context.auth.organizationId);
    const result = await explorePrompt(args, context.billing);
    const successes = result.results.filter(
      (item) => item.status === "success",
    ).length;
    const failures = result.results.length - successes;
    return mcpResponse({
      text:
        `Prompt Explorer returned ${successes} successful model result(s)` +
        (failures > 0 ? ` and ${failures} failure(s).` : "."),
      meta: buildProjectMeta(
        context,
        args.projectId,
        `/p/${args.projectId}/prompt-explorer`,
      ),
      structuredContent: result,
    });
  }),
};

/**
 * Multi-Agent Patch Generation Service
 *
 * Consults multiple AI agents (Claude and Gemini) to generate
 * code patches for detected errors. Compares solutions and
 * selects the best approach.
 */

import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { DetectedError } from './errorMonitorService';
import fs from 'fs';
import path from 'path';

export interface AgentSolution {
  agentName: 'claude' | 'gemini';
  analysisTime: number;
  confidence: number; // 0-100
  solution: {
    description: string;
    rootCause: string;
    steps: string[];
    patches: CodePatch[];
    requiresReinstall: boolean;
    requiresRebuild: boolean;
    requiresRestart: boolean;
  };
  reasoning: string;
}

export interface CodePatch {
  file: string;
  action: 'create' | 'modify' | 'delete';
  originalContent?: string;
  newContent?: string;
  lineStart?: number;
  lineEnd?: number;
  description: string;
}

export interface ComparisonResult {
  recommendedSolution: AgentSolution;
  allSolutions: AgentSolution[];
  comparisonAnalysis: {
    agreement: number; // 0-100
    differences: string[];
    strengths: Record<string, string[]>;
    weaknesses: Record<string, string[]>;
  };
  improvedSolution?: AgentSolution;
}

export class MultiAgentPatchService {
  private anthropic: Anthropic;
  private gemini: GoogleGenerativeAI;
  private readonly timeout = 30000; // 30 second timeout

  constructor() {
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

    if (!anthropicKey) {
      console.warn('[MultiAgent] ANTHROPIC_API_KEY not found');
    }
    if (!geminiKey) {
      console.warn('[MultiAgent] GEMINI_API_KEY not found');
    }

    this.anthropic = new Anthropic({
      apiKey: anthropicKey || 'dummy-key',
    });

    this.gemini = new GoogleGenerativeAI(geminiKey || 'dummy-key');
  }

  /**
   * Generate patches by consulting multiple AI agents
   */
  async generatePatches(error: DetectedError): Promise<ComparisonResult> {
    console.log(`[MultiAgent] Consulting agents for error: ${error.id}`);

    // Gather context about the error
    const context = await this.gatherContext(error);

    // Consult both agents in parallel
    const [claudeSolution, geminiSolution] = await Promise.allSettled([
      this.consultClaude(error, context),
      this.consultGemini(error, context),
    ]);

    const solutions: AgentSolution[] = [];

    if (claudeSolution.status === 'fulfilled' && claudeSolution.value) {
      solutions.push(claudeSolution.value);
    }
    if (geminiSolution.status === 'fulfilled' && geminiSolution.value) {
      solutions.push(geminiSolution.value);
    }

    if (solutions.length === 0) {
      throw new Error('No agents were able to generate a solution');
    }

    // Compare solutions
    const comparison = await this.compareSolutions(solutions, error, context);

    // Improve solution by combining best aspects
    const improvedSolution = await this.improveSolution(comparison, error, context);

    return {
      ...comparison,
      improvedSolution,
    };
  }

  /**
   * Consult Claude for a solution
   */
  private async consultClaude(
    error: DetectedError,
    context: string
  ): Promise<AgentSolution | null> {
    const startTime = Date.now();

    try {
      const prompt = this.buildPrompt(error, context);

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      const solution = this.parseSolution(content.text);
      const analysisTime = Date.now() - startTime;

      return {
        agentName: 'claude',
        analysisTime,
        confidence: this.calculateConfidence(solution, error),
        solution,
        reasoning: content.text,
      };
    } catch (error) {
      console.error('[MultiAgent] Claude consultation failed:', error);
      return null;
    }
  }

  /**
   * Consult Gemini for a solution
   */
  private async consultGemini(
    error: DetectedError,
    context: string
  ): Promise<AgentSolution | null> {
    const startTime = Date.now();

    try {
      const model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-pro' });
      const prompt = this.buildPrompt(error, context);

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      const solution = this.parseSolution(text);
      const analysisTime = Date.now() - startTime;

      return {
        agentName: 'gemini',
        analysisTime,
        confidence: this.calculateConfidence(solution, error),
        solution,
        reasoning: text,
      };
    } catch (error) {
      console.error('[MultiAgent] Gemini consultation failed:', error);
      return null;
    }
  }

  /**
   * Build prompt for AI agents
   */
  private buildPrompt(error: DetectedError, context: string): string {
    return `You are an expert software engineer debugging a production system error. Analyze the error and provide a detailed solution.

ERROR DETAILS:
- Type: ${error.type}
- Severity: ${error.severity}
- Message: ${error.message}
- Context: ${JSON.stringify(error.context, null, 2)}
- Metadata: ${JSON.stringify(error.metadata, null, 2)}
${error.stackTrace ? `\nStack Trace:\n${error.stackTrace}` : ''}

CODEBASE CONTEXT:
${context}

Provide your response in the following JSON format:
{
  "description": "Brief description of the fix",
  "rootCause": "Explanation of what caused the error",
  "steps": ["Step 1", "Step 2", ...],
  "patches": [
    {
      "file": "path/to/file.ts",
      "action": "modify",
      "description": "What this patch does",
      "newContent": "Full file content with fix applied"
    }
  ],
  "requiresReinstall": false,
  "requiresRebuild": true,
  "requiresRestart": true
}

Important:
- Provide complete, working code in patches
- Include all necessary imports
- Ensure type safety
- Follow existing code style
- Be specific and actionable
`;
  }

  /**
   * Parse AI response into structured solution
   */
  private parseSolution(text: string): AgentSolution['solution'] {
    try {
      // Try to extract JSON from response
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const json = jsonMatch[1] || jsonMatch[0];
        const parsed = JSON.parse(json);

        return {
          description: parsed.description || 'No description provided',
          rootCause: parsed.rootCause || 'Unknown',
          steps: parsed.steps || [],
          patches: parsed.patches || [],
          requiresReinstall: parsed.requiresReinstall || false,
          requiresRebuild: parsed.requiresRebuild || false,
          requiresRestart: parsed.requiresRestart || false,
        };
      }

      // Fallback: parse freeform text
      return {
        description: 'Manual review required',
        rootCause: 'Could not parse structured response',
        steps: ['Review AI response manually'],
        patches: [],
        requiresReinstall: false,
        requiresRebuild: false,
        requiresRestart: false,
      };
    } catch (error) {
      console.error('[MultiAgent] Failed to parse solution:', error);
      return {
        description: 'Parse error',
        rootCause: 'Failed to parse AI response',
        steps: [],
        patches: [],
        requiresReinstall: false,
        requiresRebuild: false,
        requiresRestart: false,
      };
    }
  }

  /**
   * Compare solutions from different agents
   */
  private async compareSolutions(
    solutions: AgentSolution[],
    error: DetectedError,
    context: string
  ): Promise<Omit<ComparisonResult, 'improvedSolution'>> {
    console.log(`[MultiAgent] Comparing ${solutions.length} solutions`);

    // Calculate agreement score
    const agreement = this.calculateAgreement(solutions);

    // Identify differences
    const differences = this.identifyDifferences(solutions);

    // Analyze strengths and weaknesses
    const strengths: Record<string, string[]> = {};
    const weaknesses: Record<string, string[]> = {};

    solutions.forEach((sol) => {
      strengths[sol.agentName] = this.identifyStrengths(sol);
      weaknesses[sol.agentName] = this.identifyWeaknesses(sol);
    });

    // Select recommended solution (highest confidence)
    const recommendedSolution = solutions.reduce((best, current) =>
      current.confidence > best.confidence ? current : best
    );

    return {
      recommendedSolution,
      allSolutions: solutions,
      comparisonAnalysis: {
        agreement,
        differences,
        strengths,
        weaknesses,
      },
    };
  }

  /**
   * Improve solution by combining best aspects from all agents
   */
  private async improveSolution(
    comparison: Omit<ComparisonResult, 'improvedSolution'>,
    error: DetectedError,
    context: string
  ): Promise<AgentSolution> {
    // If only one solution, return it
    if (comparison.allSolutions.length === 1) {
      return comparison.allSolutions[0];
    }

    // Combine insights from all solutions
    const combinedSteps = new Set<string>();
    const combinedPatches = new Map<string, CodePatch>();

    comparison.allSolutions.forEach((sol) => {
      sol.solution.steps.forEach((step) => combinedSteps.add(step));
      sol.solution.patches.forEach((patch) => {
        const key = `${patch.file}:${patch.action}`;
        if (!combinedPatches.has(key)) {
          combinedPatches.set(key, patch);
        }
      });
    });

    // Build improved solution
    const recommended = comparison.recommendedSolution;
    return {
      agentName: 'claude', // Primary agent
      analysisTime: recommended.analysisTime,
      confidence: Math.min(100, recommended.confidence + 10), // Boost confidence
      solution: {
        ...recommended.solution,
        description: `Improved: ${recommended.solution.description}`,
        steps: Array.from(combinedSteps),
        patches: Array.from(combinedPatches.values()),
      },
      reasoning: `Combined insights from ${comparison.allSolutions.length} agents`,
    };
  }

  /**
   * Gather context about the error
   */
  private async gatherContext(error: DetectedError): Promise<string> {
    const context: string[] = [];

    // Add file content if available
    if (error.context.file) {
      try {
        const filePath = path.join(process.cwd(), error.context.file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          const lines = content.split('\n');

          // Include surrounding context (20 lines before and after)
          const lineNum = error.context.line || 0;
          const start = Math.max(0, lineNum - 20);
          const end = Math.min(lines.length, lineNum + 20);

          context.push(`File: ${error.context.file}`);
          context.push('```typescript');
          context.push(lines.slice(start, end).join('\n'));
          context.push('```');
        }
      } catch (err) {
        // Ignore file read errors
      }
    }

    // Add package.json for dependency errors
    if (error.type === 'dependency') {
      try {
        const pkgPath = path.join(process.cwd(), 'package.json');
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        context.push('\nPackage.json dependencies:');
        context.push(JSON.stringify(pkg.dependencies, null, 2));
        context.push('\nPackage.json devDependencies:');
        context.push(JSON.stringify(pkg.devDependencies, null, 2));
      } catch (err) {
        // Ignore
      }
    }

    // Add tsconfig for TypeScript errors
    if (error.type === 'typescript') {
      try {
        const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
        const tsconfig = fs.readFileSync(tsconfigPath, 'utf-8');
        context.push('\ntsconfig.json:');
        context.push('```json');
        context.push(tsconfig);
        context.push('```');
      } catch (err) {
        // Ignore
      }
    }

    return context.join('\n');
  }

  /**
   * Calculate confidence score for a solution
   */
  private calculateConfidence(solution: AgentSolution['solution'], error: DetectedError): number {
    let confidence = 50; // Base confidence

    // Increase confidence for detailed solutions
    if (solution.rootCause && solution.rootCause.length > 20) confidence += 10;
    if (solution.steps.length > 0) confidence += 10;
    if (solution.patches.length > 0) confidence += 20;

    // Increase confidence for actionable patches
    solution.patches.forEach((patch) => {
      if (patch.newContent) confidence += 5;
    });

    // Adjust based on error severity
    if (error.severity === 'low') confidence += 10;
    if (error.severity === 'critical') confidence -= 10;

    return Math.min(100, Math.max(0, confidence));
  }

  /**
   * Calculate agreement between solutions
   */
  private calculateAgreement(solutions: AgentSolution[]): number {
    if (solutions.length < 2) return 100;

    // Compare patches
    const patchSimilarity = this.comparePatchSimilarity(solutions);

    // Compare steps
    const stepSimilarity = this.compareStepSimilarity(solutions);

    return Math.round((patchSimilarity + stepSimilarity) / 2);
  }

  /**
   * Compare patch similarity between solutions
   */
  private comparePatchSimilarity(solutions: AgentSolution[]): number {
    const allFiles = new Set<string>();
    solutions.forEach((sol) => sol.solution.patches.forEach((p) => allFiles.add(p.file)));

    if (allFiles.size === 0) return 100;

    let matches = 0;
    allFiles.forEach((file) => {
      const patchesForFile = solutions
        .map((sol) => sol.solution.patches.find((p) => p.file === file))
        .filter(Boolean);

      if (patchesForFile.length === solutions.length) {
        matches++;
      }
    });

    return Math.round((matches / allFiles.size) * 100);
  }

  /**
   * Compare step similarity between solutions
   */
  private compareStepSimilarity(solutions: AgentSolution[]): number {
    const allSteps = new Set<string>();
    solutions.forEach((sol) => sol.solution.steps.forEach((s) => allSteps.add(s.toLowerCase())));

    if (allSteps.size === 0) return 100;

    let totalSimilarity = 0;
    solutions.forEach((sol1) => {
      solutions.forEach((sol2) => {
        if (sol1 === sol2) return;

        const common = sol1.solution.steps.filter((s1) =>
          sol2.solution.steps.some(
            (s2) =>
              s1.toLowerCase().includes(s2.toLowerCase()) ||
              s2.toLowerCase().includes(s1.toLowerCase())
          )
        ).length;

        totalSimilarity += common;
      });
    });

    const maxPossible =
      solutions.length *
      (solutions.length - 1) *
      Math.max(...solutions.map((s) => s.solution.steps.length));

    return maxPossible > 0 ? Math.round((totalSimilarity / maxPossible) * 100) : 0;
  }

  /**
   * Identify differences between solutions
   */
  private identifyDifferences(solutions: AgentSolution[]): string[] {
    const differences: string[] = [];

    if (solutions.length < 2) return differences;

    // Compare patch counts
    const patchCounts = solutions.map((s) => s.solution.patches.length);
    if (new Set(patchCounts).size > 1) {
      differences.push(`Different number of patches: ${patchCounts.join(' vs ')}`);
    }

    // Compare reinstall requirements
    const reinstalls = solutions.map((s) => s.solution.requiresReinstall);
    if (new Set(reinstalls).size > 1) {
      differences.push('Disagreement on whether reinstall is needed');
    }

    return differences;
  }

  /**
   * Identify strengths of a solution
   */
  private identifyStrengths(solution: AgentSolution): string[] {
    const strengths: string[] = [];

    if (solution.confidence > 80) {
      strengths.push('High confidence');
    }
    if (solution.solution.patches.length > 0) {
      strengths.push('Provides concrete patches');
    }
    if (solution.solution.rootCause.length > 50) {
      strengths.push('Detailed root cause analysis');
    }
    if (solution.analysisTime < 5000) {
      strengths.push('Fast response time');
    }

    return strengths;
  }

  /**
   * Identify weaknesses of a solution
   */
  private identifyWeaknesses(solution: AgentSolution): string[] {
    const weaknesses: string[] = [];

    if (solution.confidence < 50) {
      weaknesses.push('Low confidence');
    }
    if (solution.solution.patches.length === 0) {
      weaknesses.push('No concrete patches provided');
    }
    if (solution.solution.steps.length === 0) {
      weaknesses.push('No implementation steps');
    }

    return weaknesses;
  }
}

// Singleton instance
export const multiAgentPatchService = new MultiAgentPatchService();

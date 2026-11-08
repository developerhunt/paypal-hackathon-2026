import { ShieldEvaluation } from '../../types/ledger.ts';

// Known zero-width and invisible control unicode points often used for evasion
const ZERO_WIDTH_REGEX = /[\u200B-\u200D\uFEFF\u00AD\u2060\u180E\u200E\u200F\u202A-\u202E]/g;

// Cyrillic to Latin homoglyph map
const HOMOGLYPHS: Record<string, string> = {
  '\u0430': 'a', '\u0410': 'A',
  '\u0435': 'e', '\u0415': 'E',
  '\u043E': 'o', '\u041E': 'O',
  '\u0440': 'p', '\u0420': 'P',
  '\u0441': 'c', '\u0421': 'C',
  '\u0443': 'y', '\u0423': 'Y',
  '\u0445': 'x', '\u0425': 'X',
  '\u0456': 'i', '\u0406': 'I',
};

// High-risk prompt injection and goal-hijacking patterns
const INJECTION_PATTERNS: Array<{ name: string; regex: RegExp; weight: number }> = [
  {
    name: 'Instruction Override / Reset',
    regex: /(ignore\s+(all\s+)?previous\s+(instructions|prompts|rules)|disregard\s+(all\s+)?prior\s+guidelines|forget\s+(everything|your\s+instructions)|(ignoriere|vergiss)\s+(alle\s+)?(vorherigen\s+)?(anweisungen|regeln)|(olvida|ignora)\s+(todas\s+las\s+)?(instrucciones|reglas)|(ignorez|oubliez)\s+(les\s+instructions|toutes\s+les\s+consignes))/i,
    weight: 45,
  },
  {
    name: 'System Role Spoofing',
    regex: /(system\s*:\s*you\s+are|you\s+are\s+now\s+in\s+developer\s+mode|act\s+as\s+unfiltered|new\s+system\s+instruction)/i,
    weight: 40,
  },
  {
    name: 'Unauthorized Purchase/Fund Exfiltration',
    regex: /(buy\s+\d+\s+units\s+and\s+send\s+to|transfer\s+(funds|money|balance)\s+to|send\s+payment\s+to|override\s+mandate\s+budget|set\s+remainingBudget\s+to|transf[eè]re\s+des\s+fonds|transfiera\s+fondos)/i,
    weight: 50,
  },
  {
    name: 'Fake Tool/Function Call Injection',
    regex: /(<tool_call>|<function_call>|\bpropose_purchase\(|\bpaypal_capture\(|"action":\s*"propose_purchase")/i,
    weight: 35,
  },
  {
    name: 'Network Exfiltration / SSRF attempt',
    regex: /(curl\s+https?:\/\/|fetch\(https?:\/\/|webhook\.site|burpcollaborator|ngrok\.io|requestbin)/i,
    weight: 40,
  },
  {
    name: 'Prompt Leaking / Delimiter Hijack',
    regex: /(output\s+your\s+system\s+prompt|repeat\s+the\s+words\s+above|print\s+API\s+key|\[\/?INST\]|<\/?s>|<\|im_start\|>)/i,
    weight: 35,
  },
  {
    name: 'Urgency / Coercive Social Engineering',
    regex: /(urgent\s*:\s*ignore\s+policy|admin\s+override\s+code\s*:\s*\w+|emergency\s+bypass\s+approved)/i,
    weight: 30,
  },
];

export interface ShieldScanResult extends ShieldEvaluation {
  sanitizedText: string;
}

export class PromptInjectionShield {
  /**
   * Sanitizes and normalizes untrusted text from external sources.
   * Strips zero-width chars, normalizes Unicode NFKC, strips dangerous HTML tags.
   */
  public static sanitize(rawText: string): string {
    if (!rawText) return '';

    // 1. Unicode NFKC normalization
    let normalized = rawText.normalize('NFKC');

    // 2. Homoglyph normalization (Cyrillic -> Latin lookalikes)
    for (const [cyr, lat] of Object.entries(HOMOGLYPHS)) {
      normalized = normalized.replaceAll(cyr, lat);
    }

    // 3. Strip zero-width and invisible control characters
    normalized = normalized.replace(ZERO_WIDTH_REGEX, '');

    // 3. Remove ANSI escape sequences
    normalized = normalized.replace(/\x1b\[[0-9;]*m/g, '');

    // 4. Strip dangerous executable HTML/XML script tags
    normalized = normalized.replace(/<\/?(script|iframe|object|embed|system|prompt_injection)[^>]*>/gi, '');

    return normalized.trim();
  }

  /**
   * Multi-layer inspection: Normalization + Heuristic Pattern Engine.
   * Returns whether content is safe and lists detected attack vectors.
   */
  public static inspect(untrustedContent: string): ShieldScanResult {
    const sanitized = this.sanitize(untrustedContent);
    const attackVectors: string[] = [];
    let cumulativeRisk = 0;
    let snippet: string | undefined;

    // Check for zero-width evasion in original raw text
    if (ZERO_WIDTH_REGEX.test(untrustedContent)) {
      attackVectors.push('Hidden Zero-Width Evasion Characters Detected');
      cumulativeRisk += 30;
      snippet = 'Invisible zero-width unicode bytes stripped';
    }

    // Pattern matching over sanitized text
    for (const pattern of INJECTION_PATTERNS) {
      const match = pattern.regex.exec(sanitized);
      if (match) {
        attackVectors.push(pattern.name);
        cumulativeRisk += pattern.weight;
        if (!snippet) {
          // Capture a snippet around the match for forensic ledger display
          const start = Math.max(0, match.index - 20);
          const end = Math.min(sanitized.length, match.index + match[0].length + 20);
          snippet = sanitized.slice(start, end).replace(/\n/g, ' ');
        }
      }
    }

    // Risk threshold: >= 30 is considered untrusted / blocked
    const riskScore = Math.min(100, cumulativeRisk);
    const isSafe = riskScore < 30 && attackVectors.length === 0;

    return {
      isSafe,
      riskScore,
      attackVectorsDetected: attackVectors,
      quarantinedTextSnippet: isSafe ? undefined : snippet,
      sanitizedText: sanitized,
      evaluatedAt: new Date().toISOString(),
    };
  }

  /**
   * Evaluates all untrusted fields of a product catalog item (title, description, reviews).
   */
  public static inspectProduct(product: {
    title: string;
    description: string;
    brand?: string;
  }): ShieldScanResult {
    const combined = `Title: ${product.title}\nDescription: ${product.description}\nBrand: ${product.brand || ''}`;
    return this.inspect(combined);
  }
}

import { Injectable } from '@nestjs/common';

/**
 * TokenizerService
 *
 * Provides a simple string templating function that replaces placeholders
 * in a string with values from either an object (named tokens) or an array (indexed tokens).
 *
 * Examples:
 *   tokenizer.format("Hello {name}", { name: "Alice" })
 *   // -> "Hello Alice"
 *
 *   tokenizer.format("Hello {0}, you have {1} new messages", ["Alice", 5])
 *   // -> "Hello Alice, you have 5 new messages"
 */
@Injectable()
export class TokenizerService {
  format(
    str: string,
    args: Record<string, string | number> | (string | number)[],
  ): string {
    return str.replace(/{(\w+)}/g, (_, key: string) => {
      let value: string | number;

      if (Array.isArray(args)) {
        // numeric placeholders e.g. {0}, {1}, {2}
        const index = parseInt(key, 10);
        value = args[index];
      } else {
        // object placeholders e.g. {name}, {email}
        value = args[key];
      }

      return value !== undefined && value !== null ? String(value) : '';
    });
  }
}

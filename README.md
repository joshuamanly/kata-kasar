# kata-kasar

A powerful, lightweight, and multilingual library to filter, censor, and detect profanity (bad words) in text. Primarily designed for **Bahasa Indonesia** and **English**, it supports fuzzy matching, leetspeak detection, and dynamic dictionary management.

## Features

- **Multilingual Support**: Built-in support for Indonesian and English dictionaries.
- **Leetspeak Detection**: Automatically normalizes and detects leetspeak (e.g., `4njing`, `sh1t`).
- **Fuzzy Matching**: Uses Damerau-Levenshtein distance to detect typos or deliberate misspellings.
- **Detailed Analysis**: Get comprehensive details about detected words, including confidence levels and match categories.
- **Dictionary Management**: Add, remove, or override usage dictionaries dynamically at runtime.
- **TypeScript Support**: Fully typed for better developer experience.

## Installation

```bash
npm install kata-kasar
```

## Usage

### Basic Usage

```typescript
import { analyze, censor, flag } from "kata-kasar";

// 1. Analyze text (Recommended)
const result = analyze("Dasar lo anjing!");
console.log(result);
/*
{
  original: "Dasar lo anjing!",
  filtered: "Dasar lo ******!",
  isProfane: true,
  decision: "CENSOR",
  data: [ ... ]
}
*/

// 2. Simple Boolean Check
const isBad = flag("This is shit"); // true

// 3. Censor Text
const clean = censor("Dasar lo anjing"); // "Dasar lo ******"
```

## API Reference

### Core Functions

#### `analyze(text: string, options?: AnalyzeOptions): AnalyzeResult`

The most robust function in the library. It performs validation, normalization, tokenization, and fuzzy detection against the blacklist and whitelist.

**Options:**
- `type`: `'username' | 'text'` (default: `'text'`)
- `threshold`: `number` (default: `3`) - Maximum edit distance for fuzzy matching.

**Returns** an `AnalyzeResult` object containing:
- `original`: Input text.
- `filtered`: Text with profanity masked.
- `isProfane`: Boolean indicating if profanity was found.
- `decision`: `'CENSOR' | 'ALLOW'`.
- `data`: Array of detailed matches.

#### `censor(text: string, replacement?: string): string`
Replaces bad words in the text.
- `replacement`: defaults to `"***"`, but can be a single character like `*` to mask each character.

#### `flag(text: string): boolean`
Returns `true` if the text contains any bad words.

#### `filter(text: string): string`
Removes bad words from the text completely.

#### `extract(text: string): string[]`
Returns an array of all bad words found in the text.

> **Note**: Methods like `leetCensor`, `leetFlag`, `leetFilter`, and `leetExtract` are also available. These normalize the input (convert leetspeak) *before* processing, referring to the normalized text in their output.

### Dictionary Management

You can modify the blacklist and whitelist at runtime. Functions support a `lang` parameter (e.g., `'id'`, `'en'`) to target specific dictionaries.

```typescript
import { addBlacklist, removeBlacklist, addWhitelist } from "kata-kasar";

// Add specific words to the Indonesian blacklist
addBlacklist(["krupuk", "seblak"], "id");

// Remove words from the English blacklist
removeBlacklist("hell", "en");

// Add words to the whitelist (bypass checks)
addWhitelist(["hello", "analysis"], "en");
```

### Fuzzy Utilities

Exposed for cases where you need raw string comparison.

```typescript
import { distance, similarity } from "kata-kasar";

// Damerau-Levenshtein distance
const dist = distance("kitten", "sitten"); // 1

// Cosine similarity
const sim = similarity("hello", "hello world"); // 0.7...
```

## License

MIT License

/**
 * Small relevance-ranked search shared by the public site and the team space.
 * It ignores accents, Arabic diacritics and letter variants, tolerates typos and
 * favours matches in titles over matches in descriptions.
 */

export type SearchField = { text: string; weight: number };
export type PreparedField = { phraseText: string; tokens: string[]; weight: number };
export type PreparedDoc<T> = { item: T; fields: PreparedField[] };
export type SearchHit<T> = { item: T; score: number };

const STOP_WORDS = new Set([
  // fr
  "a", "au", "aux", "avec", "ce", "de", "des", "du", "en", "et", "je", "la", "le", "les", "ma", "mes", "mon", "ou", "par", "pour", "sur", "un", "une", "vos", "votre", "veux", "cherche", "besoin",
  // en
  "an", "and", "for", "i", "my", "need", "of", "the", "to", "want", "with",
  // ar
  "في", "من", "على", "الى", "عن", "مع", "او",
]);

function normalizeChar(char: string): string {
  return char
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ًͯ-ٰٟـ]/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae");
}

/** Lower-case text without accents, Arabic diacritics or punctuation. */
export function normalizeText(value: string): string {
  return Array.from(value, normalizeChar)
    .join("")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Light stemming: French plurals and the Arabic definite article. */
function stem(token: string): string {
  let result = token;
  if (/^[؀-ۿ]/.test(result) && result.startsWith("ال") && result.length > 4) result = result.slice(2);
  // "-s" plurals, and "-x" only after "au"/"eu" so that "prix" or "choix" stay intact.
  if (/^[a-z]/.test(result) && result.length > 3 && (/[^s]s$/.test(result) || /[ae]ux$/.test(result))) result = result.slice(0, -1);
  return result;
}

export function tokenize(value: string, keepStopWords = false): string[] {
  return normalizeText(value)
    .split(" ")
    .filter((token) => token && (keepStopWords || !STOP_WORDS.has(token)))
    .map(stem);
}

/** Damerau-Levenshtein distance, abandoned as soon as it exceeds `max`. */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const previous: number[][] = [];
  let row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    let rowMin = current[0];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(row[j] + 1, current[j - 1] + 1, row[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        value = Math.min(value, previous[previous.length - 1][j - 2] + 1);
      }
      current.push(value);
      rowMin = Math.min(rowMin, value);
    }
    if (rowMin > max) return max + 1;
    previous.push(row);
    row = current;
  }
  return row[b.length];
}

/** How well one query word matches one indexed word, from 0 (no match) to 1 (identical). */
function tokenScore(query: string, word: string): number {
  if (word === query) return 1;
  if (query.length >= 2 && word.startsWith(query)) return 0.85;
  if (query.length >= 4 && word.includes(query)) return 0.6;
  const allowed = query.length >= 8 ? 2 : query.length >= 4 ? 1 : 0;
  if (!allowed) return 0;
  const distance = editDistance(query, word, allowed);
  if (distance <= allowed) return 0.72 - distance * 0.12;
  // Typo inside a longer word still being typed: compare with the start of the indexed word.
  if (query.length >= 5 && word.length > query.length && editDistance(query, word.slice(0, query.length), 1) <= 1) return 0.5;
  return 0;
}

export function prepareDoc<T>(item: T, fields: SearchField[]): PreparedDoc<T> {
  return {
    item,
    fields: fields
      .filter((field) => field.text)
      .map((field) => {
        const tokens = tokenize(field.text, true);
        // Phrases are compared on stemmed words so "carte de visite" also finds "Cartes de visite".
        return { phraseText: tokens.join(" "), tokens, weight: field.weight };
      }),
  };
}

function scoreDoc<T>(doc: PreparedDoc<T>, queryTokens: string[], phrase: string, requireAll: boolean): number {
  let total = 0;
  let matched = 0;
  for (const query of queryTokens) {
    let best = 0;
    for (const field of doc.fields) {
      for (const word of field.tokens) {
        const score = tokenScore(query, word) * field.weight;
        if (score > best) best = score;
      }
    }
    if (best > 0) matched += 1;
    else if (requireAll) return 0;
    total += best;
  }
  if (!matched || (!requireAll && matched < Math.ceil(queryTokens.length / 2))) return 0;
  // Whole-phrase and start-of-field bonuses keep the most obvious result first.
  // Phrases only count from the start of a word, so "pri" never matches inside "imprimé".
  for (const field of doc.fields) {
    if (queryTokens.length > 1) {
      if (` ${field.phraseText}`.includes(` ${phrase}`)) total += field.weight * 0.6;
      if (field.phraseText.startsWith(phrase)) total += field.weight * 0.4;
    } else if (field.tokens[0] === queryTokens[0]) {
      total += field.weight * 0.4;
    }
  }
  return requireAll ? total : total * 0.6;
}

/**
 * Ranks documents for a query. Every word must match something; when nothing
 * matches all words, results matching at least half of them are returned instead.
 */
export function searchDocs<T>(docs: PreparedDoc<T>[], query: string, limit = 50): SearchHit<T>[] {
  const queryTokens = tokenize(query);
  const tokens = queryTokens.length ? queryTokens : tokenize(query, true);
  if (!tokens.length) return [];
  const phrase = tokenize(query, true).join(" ");
  const rank = (requireAll: boolean) =>
    docs
      .map((doc) => ({ item: doc.item, score: scoreDoc(doc, tokens, phrase, requireAll) }))
      .filter((hit) => hit.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, limit);
  const strict = rank(true);
  return strict.length || tokens.length === 1 ? strict : rank(false);
}

/** Splits `text` into parts flagged when they start with one of the query words, for highlighting. */
export function highlightParts(text: string, query: string): { text: string; match: boolean }[] {
  const words = normalizeText(query).split(" ").filter((word) => word.length >= 2);
  if (!words.length) return [{ text, match: false }];
  const chars = Array.from(text);
  const normalizedChars = chars.map(normalizeChar);
  const flags = new Array<boolean>(chars.length).fill(false);
  const isLetter = (value: string) => /[\p{L}\p{N}]/u.test(value);

  for (let start = 0; start < chars.length; start += 1) {
    if (start > 0 && isLetter(normalizedChars[start - 1])) continue;
    for (const word of words) {
      let built = "";
      let end = start;
      while (end < chars.length && built.length < word.length) {
        built += normalizedChars[end];
        end += 1;
      }
      if (built.startsWith(word)) for (let index = start; index < end; index += 1) flags[index] = true;
    }
  }

  const parts: { text: string; match: boolean }[] = [];
  chars.forEach((char, index) => {
    const last = parts[parts.length - 1];
    if (last && last.match === flags[index]) last.text += char;
    else parts.push({ text: char, match: flags[index] });
  });
  return parts;
}

/** Digits of a phone number without the Tunisian country code, for phone lookups. */
export function phoneDigits(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("00216")) return digits.slice(5);
  if (digits.startsWith("216") && digits.length > 8) return digits.slice(3);
  return digits;
}

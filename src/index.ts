/**
 * asktian-sdk — Official JavaScript/TypeScript SDK for the askTIAN Metaphysics API
 *
 * Usage:
 *   import { AskTianClient } from "asktian-sdk";
 *   const client = new AskTianClient({ apiKey: "YOUR_API_KEY" });
 *   const result = await client.qimen.calculate({ date: "2026-03-19", time: "10:00", question: "..." });
 *
 *   // Streaming blended reading
 *   for await (const event of client.tian.eastern.stream({ birthdate: "1990-01-15" })) {
 *     if (event.type === "system")          console.log(event.name, event.score);
 *     if (event.type === "synthesis_chunk") process.stdout.write(event.chunk);
 *     if (event.type === "done")            console.log("Score:", event.blendedScore);
 *   }
 */

const BASE_URL = "https://api.asktian.com/trpc";
const STREAM_BASE_URL = "https://api.asktian.com/api/stream/tian";

// ── Shared types ─────────────────────────────────────────────────────────────

export interface AskTianClientOptions {
  /** Your askTIAN API key (starts with at_live_ or at_test_) */
  apiKey: string;
  /** Override the base URL (useful for testing against a local proxy) */
  baseUrl?: string;
  /** Override the streaming base URL */
  streamBaseUrl?: string;
}

export interface AskTianResponse<T = unknown> {
  result: { data: { json: T } };
}

// ── Streaming event types ─────────────────────────────────────────────────────

export interface TianSystemEvent {
  type: "system";
  name: string;
  score: number;
  result: unknown;
}

export interface TianSynthesisChunkEvent {
  type: "synthesis_chunk";
  chunk: string;
}

export interface TianDoneEvent {
  type: "done";
  blendedScore: number;
  creditsUsed: number;
  systemCount: number;
  durationMs: number;
  traditionScores?: Record<string, number>;
}

export interface TianErrorEvent {
  type: "error";
  message: string;
  code: string;
}

export type TianStreamEvent =
  | TianSystemEvent
  | TianSynthesisChunkEvent
  | TianDoneEvent
  | TianErrorEvent;

// ── Input types ───────────────────────────────────────────────────────────────

export interface DateTimeInput {
  date: string;       // YYYY-MM-DD
  time: string;       // HH:MM (24h)
  question?: string;
}

export interface BirthdateInput {
  birthdate: string;  // YYYY-MM-DD
  question?: string;
  [key: string]: unknown;
}

export interface BirthdateTimeInput {
  birthdate: string;
  birthTime?: string;
  birthPlace?: string;
  question?: string;
  [key: string]: unknown;
}

export interface CompatibilityInput {
  birthDate1: string;
  birthDate2: string;
}

export interface NameInput {
  surname: string;
  givenName: string;
}

export interface AuspiciousInput {
  input: string;
  type: "number" | "date" | "name";
}

export interface AlmanacInput {
  date: string;
}

export interface DivinationInput {
  system: string;
  question?: string;
}

export interface TarotInput {
  spread: "single" | "three_card" | "celtic_cross";
  question?: string;
}

export interface CoinFlipInput {
  question?: string;
  aspect?: string;
  flips?: number;
}

export interface RunesInput {
  spread: "single" | "three_rune" | "five_rune";
  question?: string;
}

export interface NumerologyInput {
  fullName: string;
  birthdate: string;
}

export interface AstrologyInput {
  birthdate: string;
  question?: string;
}

export interface ZodiacInput {
  birthDate1: string;
  birthDate2: string;
}

export interface BirthdayInput {
  date1: string;
  date2: string;
}

export interface BloodtypeInput {
  type1: "A" | "B" | "AB" | "O";
  type2: "A" | "B" | "AB" | "O";
}

// ── Core client ───────────────────────────────────────────────────────────────

class AskTianBase {
  protected readonly apiKey: string;
  protected readonly baseUrl: string;
  protected readonly streamBaseUrl: string;

  constructor(options: AskTianClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? BASE_URL;
    this.streamBaseUrl = options.streamBaseUrl ?? STREAM_BASE_URL;
  }

  protected async post<TInput, TOutput>(
    procedure: string,
    input: TInput
  ): Promise<TOutput> {
    const url = `${this.baseUrl}/${procedure}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ json: input }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg =
        (body as { error?: { message?: string } })?.error?.message ??
        `HTTP ${res.status}`;
      throw new AskTianError(msg, res.status, body);
    }

    const body = (await res.json()) as AskTianResponse<TOutput>;
    return body.result.data.json;
  }

  /**
   * Open an SSE stream to a blended TIAN endpoint and yield typed events.
   * Works in Node.js 18+ (native fetch + ReadableStream) and all modern browsers.
   */
  protected async *stream<TInput extends Record<string, unknown>>(
    tradition: string,
    input: TInput
  ): AsyncGenerator<TianStreamEvent> {
    const params = new URLSearchParams({ apiKey: this.apiKey });
    for (const [k, v] of Object.entries(input)) {
      if (v !== undefined && v !== null) params.set(k, String(v));
    }

    const url = `${this.streamBaseUrl}/${tradition}?${params.toString()}`;
    const res = await fetch(url, {
      headers: { Accept: "text/event-stream" },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg =
        (body as { message?: string })?.message ?? `HTTP ${res.status}`;
      throw new AskTianError(msg, res.status, body);
    }

    if (!res.body) throw new AskTianError("No response body", 0, null);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let currentEvent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.startsWith("event: ")) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith("data: ")) {
          const raw = line.slice(6).trim();
          try {
            const data = JSON.parse(raw);
            if (currentEvent === "system") {
              yield { type: "system", name: data.name, score: data.score, result: data.result } as TianSystemEvent;
            } else if (currentEvent === "synthesis_chunk") {
              yield { type: "synthesis_chunk", chunk: data.chunk } as TianSynthesisChunkEvent;
            } else if (currentEvent === "done") {
              yield { type: "done", ...data } as TianDoneEvent;
              return;
            } else if (currentEvent === "error") {
              yield { type: "error", message: data.message, code: data.code } as TianErrorEvent;
              return;
            }
          } catch {
            // malformed SSE line — skip
          }
          currentEvent = "";
        }
      }
    }
  }
}

export class AskTianError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown
  ) {
    super(message);
    this.name = "AskTianError";
  }
}

// ── Namespace classes ─────────────────────────────────────────────────────────

class QimenNamespace extends AskTianBase {
  calculate(input: DateTimeInput) {
    return this.post<DateTimeInput, unknown>("qimen.calculate", input);
  }
}

class LiuyaoNamespace extends AskTianBase {
  calculate(input: DateTimeInput) {
    return this.post<DateTimeInput, unknown>("liuyao.calculate", input);
  }
}

class MeihuaNamespace extends AskTianBase {
  calculate(input: DateTimeInput) {
    return this.post<DateTimeInput, unknown>("meihua.calculate", input);
  }
}

class DaliuNamespace extends AskTianBase {
  calculate(input: DateTimeInput) {
    return this.post<DateTimeInput, unknown>("daliu.calculate", input);
  }
}

class XiaoliuNamespace extends AskTianBase {
  calculate(input: DateTimeInput) {
    return this.post<DateTimeInput, unknown>("xiaoliu.calculate", input);
  }
}

class TaiyiNamespace extends AskTianBase {
  calculate(input: DateTimeInput) {
    return this.post<DateTimeInput, unknown>("taiyi.calculate", input);
  }
}

class NameAnalysisNamespace extends AskTianBase {
  analyze(input: NameInput) {
    return this.post<NameInput, unknown>("nameAnalysis.analyze", input);
  }
}

class CompatibilityNamespace extends AskTianBase {
  calculate(input: CompatibilityInput) {
    return this.post<CompatibilityInput, unknown>("compatibility.calculate", input);
  }
}

class AuspiciousNamespace extends AskTianBase {
  analyze(input: AuspiciousInput) {
    return this.post<AuspiciousInput, unknown>("auspicious.analyze", input);
  }
}

class AlmanacNamespace extends AskTianBase {
  get(input: AlmanacInput) {
    return this.post<AlmanacInput, unknown>("almanac.get", input);
  }
}

class DivinationNamespace extends AskTianBase {
  draw(input: DivinationInput) {
    return this.post<DivinationInput, unknown>("divination.draw", input);
  }
}

class AstrologyNamespace extends AskTianBase {
  calculate(input: AstrologyInput) {
    return this.post<AstrologyInput, unknown>("astrology.calculate", input);
  }
}

class TarotNamespace extends AskTianBase {
  draw(input: TarotInput) {
    return this.post<TarotInput, unknown>("tarot.draw", input);
  }
}

class CoinFlipNamespace extends AskTianBase {
  flip(input: CoinFlipInput) {
    return this.post<CoinFlipInput, unknown>("coinFlip.flip", input);
  }
}

class RunesNamespace extends AskTianBase {
  cast(input: RunesInput) {
    return this.post<RunesInput, unknown>("runes.cast", input);
  }
}

class NumerologyNamespace extends AskTianBase {
  calculate(input: NumerologyInput) {
    return this.post<NumerologyInput, unknown>("numerology.calculate", input);
  }
}

class ZodiacNamespace extends AskTianBase {
  calculate(input: ZodiacInput) {
    return this.post<ZodiacInput, unknown>("zodiac.calculate", input);
  }
}

class BirthdayNamespace extends AskTianBase {
  compare(input: BirthdayInput) {
    return this.post<BirthdayInput, unknown>("birthday.compare", input);
  }
}

class BloodtypeNamespace extends AskTianBase {
  compare(input: BloodtypeInput) {
    return this.post<BloodtypeInput, unknown>("bloodtype.compare", input);
  }
}

class JyotishNamespace extends AskTianBase {
  calculate(input: BirthdateTimeInput) {
    return this.post<BirthdateTimeInput, unknown>("jyotish.calculate", input);
  }
}

class IfaNamespace extends AskTianBase {
  calculate(input: BirthdateInput) {
    return this.post<BirthdateInput, unknown>("ifa.calculate", input);
  }
}

class VodunNamespace extends AskTianBase {
  calculate(input: BirthdateInput) {
    return this.post<BirthdateInput, unknown>("vodun.calculate", input);
  }
}

class HakataNamespace extends AskTianBase {
  calculate(input: BirthdateInput) {
    return this.post<BirthdateInput, unknown>("hakata.calculate", input);
  }
}

class RammalNamespace extends AskTianBase {
  calculate(input: BirthdateInput) {
    return this.post<BirthdateInput, unknown>("rammal.calculate", input);
  }
}

class AnkaNamespace extends AskTianBase {
  calculate(input: BirthdateInput) {
    return this.post<BirthdateInput, unknown>("anka.calculate", input);
  }
}

class KhattNamespace extends AskTianBase {
  calculate(input: BirthdateInput) {
    return this.post<BirthdateInput, unknown>("khatt.calculate", input);
  }
}

// ── TIAN Blended Namespace (with streaming) ───────────────────────────────────

/**
 * Each tradition method has two call signatures:
 *   - `await client.tian.eastern(input)` — resolves when all systems complete
 *   - `for await (const event of client.tian.eastern.stream(input))` — streams events progressively
 */
class TianTraditionMethod<TInput extends Record<string, unknown>> {
  private readonly _post: (input: TInput) => Promise<unknown>;
  private readonly _stream: (input: TInput) => AsyncGenerator<TianStreamEvent>;

  constructor(
    post: (input: TInput) => Promise<unknown>,
    streamFn: (input: TInput) => AsyncGenerator<TianStreamEvent>
  ) {
    this._post = post;
    this._stream = streamFn;

    // Make the instance callable as a function
    const callable = (input: TInput) => this._post(input);
    callable.stream = (input: TInput) => this._stream(input);
    return callable as unknown as TianTraditionMethod<TInput>;
  }

  stream(_input: TInput): AsyncGenerator<TianStreamEvent> {
    throw new Error("unreachable");
  }
}

class TianNamespace extends AskTianBase {
  readonly eastern: ((input: BirthdateTimeInput) => Promise<unknown>) & { stream: (input: BirthdateTimeInput) => AsyncGenerator<TianStreamEvent> };
  readonly western: ((input: BirthdateInput) => Promise<unknown>) & { stream: (input: BirthdateInput) => AsyncGenerator<TianStreamEvent> };
  readonly eastwest: ((input: BirthdateTimeInput) => Promise<unknown>) & { stream: (input: BirthdateTimeInput) => AsyncGenerator<TianStreamEvent> };
  readonly african: ((input: BirthdateInput) => Promise<unknown>) & { stream: (input: BirthdateInput) => AsyncGenerator<TianStreamEvent> };
  readonly islamic: ((input: BirthdateInput) => Promise<unknown>) & { stream: (input: BirthdateInput) => AsyncGenerator<TianStreamEvent> };
  readonly indian: ((input: BirthdateTimeInput) => Promise<unknown>) & { stream: (input: BirthdateTimeInput) => AsyncGenerator<TianStreamEvent> };
  readonly global: ((input: BirthdateTimeInput) => Promise<unknown>) & { stream: (input: BirthdateTimeInput) => AsyncGenerator<TianStreamEvent> };

  constructor(options: AskTianClientOptions) {
    super(options);

    const make = <TInput extends Record<string, unknown>>(
      procedure: string,
      tradition: string
    ) => {
      const fn = (input: TInput) =>
        this.post<TInput, unknown>(procedure, input);
      fn.stream = (input: TInput) =>
        this.stream<TInput>(tradition, input);
      return fn;
    };

    this.eastern = make<BirthdateTimeInput>("tian.eastern", "eastern");
    this.western = make<BirthdateInput>("tian.western", "western");
    this.eastwest = make<BirthdateTimeInput>("tian.eastwest", "eastwest");
    this.african = make<BirthdateInput>("tian.african", "african");
    this.islamic = make<BirthdateInput>("tian.islamic", "islamic");
    this.indian = make<BirthdateTimeInput>("tian.indian", "indian");
    this.global = make<BirthdateTimeInput>("tian.global", "global");
  }
}

// ── Main client ───────────────────────────────────────────────────────────────

/**
 * AskTianClient — entry point for the askTIAN Metaphysics API SDK.
 *
 * @example
 * ```ts
 * import { AskTianClient } from "asktian-sdk";
 *
 * const client = new AskTianClient({ apiKey: "at_live_your_key_here" });
 *
 * // Qimen Dunjia (standard call)
 * const reading = await client.qimen.calculate({
 *   date: "2026-03-19",
 *   time: "10:00",
 *   question: "Should I sign the contract today?",
 * });
 *
 * // TIAN Global — streaming (progressive)
 * for await (const event of client.tian.global.stream({
 *   birthdate: "1990-01-15",
 *   birthTime: "06:30",
 *   birthPlace: "Singapore",
 *   question: "Should I launch my business this quarter?",
 * })) {
 *   if (event.type === "system")          console.log(event.name, event.score);
 *   if (event.type === "synthesis_chunk") process.stdout.write(event.chunk);
 *   if (event.type === "done")            console.log("\nBlended score:", event.blendedScore);
 * }
 *
 * // TIAN Global — standard (waits for full response)
 * const global = await client.tian.global({
 *   birthdate: "1990-01-15",
 *   question: "Career outlook",
 * });
 * ```
 */
export class AskTianClient extends AskTianBase {
  readonly qimen: QimenNamespace;
  readonly liuyao: LiuyaoNamespace;
  readonly meihua: MeihuaNamespace;
  readonly daliu: DaliuNamespace;
  readonly xiaoliu: XiaoliuNamespace;
  readonly taiyi: TaiyiNamespace;
  readonly nameAnalysis: NameAnalysisNamespace;
  readonly compatibility: CompatibilityNamespace;
  readonly auspicious: AuspiciousNamespace;
  readonly almanac: AlmanacNamespace;
  readonly divination: DivinationNamespace;
  readonly astrology: AstrologyNamespace;
  readonly tarot: TarotNamespace;
  readonly coinFlip: CoinFlipNamespace;
  readonly runes: RunesNamespace;
  readonly numerology: NumerologyNamespace;
  readonly zodiac: ZodiacNamespace;
  readonly birthday: BirthdayNamespace;
  readonly bloodtype: BloodtypeNamespace;
  readonly jyotish: JyotishNamespace;
  readonly ifa: IfaNamespace;
  readonly vodun: VodunNamespace;
  readonly hakata: HakataNamespace;
  readonly rammal: RammalNamespace;
  readonly anka: AnkaNamespace;
  readonly khatt: KhattNamespace;
  readonly tian: TianNamespace;

  constructor(options: AskTianClientOptions) {
    super(options);
    this.qimen         = new QimenNamespace(options);
    this.liuyao        = new LiuyaoNamespace(options);
    this.meihua        = new MeihuaNamespace(options);
    this.daliu         = new DaliuNamespace(options);
    this.xiaoliu       = new XiaoliuNamespace(options);
    this.taiyi         = new TaiyiNamespace(options);
    this.nameAnalysis  = new NameAnalysisNamespace(options);
    this.compatibility = new CompatibilityNamespace(options);
    this.auspicious    = new AuspiciousNamespace(options);
    this.almanac       = new AlmanacNamespace(options);
    this.divination    = new DivinationNamespace(options);
    this.astrology     = new AstrologyNamespace(options);
    this.tarot         = new TarotNamespace(options);
    this.coinFlip      = new CoinFlipNamespace(options);
    this.runes         = new RunesNamespace(options);
    this.numerology    = new NumerologyNamespace(options);
    this.zodiac        = new ZodiacNamespace(options);
    this.birthday      = new BirthdayNamespace(options);
    this.bloodtype     = new BloodtypeNamespace(options);
    this.jyotish       = new JyotishNamespace(options);
    this.ifa           = new IfaNamespace(options);
    this.vodun         = new VodunNamespace(options);
    this.hakata        = new HakataNamespace(options);
    this.rammal        = new RammalNamespace(options);
    this.anka          = new AnkaNamespace(options);
    this.khatt         = new KhattNamespace(options);
    this.tian          = new TianNamespace(options);
  }
}

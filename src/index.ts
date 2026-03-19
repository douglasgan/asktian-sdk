/**
 * asktian-sdk — Official JavaScript/TypeScript SDK for the askTIAN Metaphysics API
 *
 * Usage:
 *   import { AskTianClient } from "asktian-sdk";
 *   const client = new AskTianClient({ apiKey: "YOUR_API_KEY" });
 *   const result = await client.qimen.calculate({ date: "2026-03-19", time: "10:00", question: "..." });
 */

const BASE_URL = "https://api.asktian.com/trpc";

// ── Shared types ─────────────────────────────────────────────────────────────

export interface AskTianClientOptions {
  /** Your askTIAN API key (starts with at_live_ or at_test_) */
  apiKey: string;
  /** Override the base URL (useful for testing against a local proxy) */
  baseUrl?: string;
}

export interface AskTianResponse<T = unknown> {
  result: { data: { json: T } };
}

// ── Input types ───────────────────────────────────────────────────────────────

export interface DateTimeInput {
  date: string;       // YYYY-MM-DD
  time: string;       // HH:MM (24h)
  question?: string;
}

export interface BirthdateInput {
  birthdate: string;  // YYYY-MM-DD
  question?: string;
}

export interface BirthdateTimeInput {
  birthdate: string;
  birthTime?: string;
  birthPlace?: string;
  question?: string;
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

  constructor(options: AskTianClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? BASE_URL;
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

class TianNamespace extends AskTianBase {
  eastern(input: BirthdateTimeInput) {
    return this.post<BirthdateTimeInput, unknown>("tian.eastern", input);
  }
  western(input: BirthdateInput) {
    return this.post<BirthdateInput, unknown>("tian.western", input);
  }
  eastwest(input: BirthdateTimeInput) {
    return this.post<BirthdateTimeInput, unknown>("tian.eastwest", input);
  }
  african(input: BirthdateInput) {
    return this.post<BirthdateInput, unknown>("tian.african", input);
  }
  islamic(input: BirthdateInput) {
    return this.post<BirthdateInput, unknown>("tian.islamic", input);
  }
  indian(input: BirthdateTimeInput) {
    return this.post<BirthdateTimeInput, unknown>("tian.indian", input);
  }
  global(input: BirthdateTimeInput) {
    return this.post<BirthdateTimeInput, unknown>("tian.global", input);
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
 * // Qimen Dunjia
 * const reading = await client.qimen.calculate({
 *   date: "2026-03-19",
 *   time: "10:00",
 *   question: "Should I sign the contract today?",
 * });
 *
 * // TIAN Global synthesis
 * const global = await client.tian.global({
 *   birthdate: "1990-01-15",
 *   birthTime: "06:30",
 *   birthPlace: "Singapore",
 *   question: "Should I launch my business this quarter?",
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
    this.qimen        = new QimenNamespace(options);
    this.liuyao       = new LiuyaoNamespace(options);
    this.meihua       = new MeihuaNamespace(options);
    this.daliu        = new DaliuNamespace(options);
    this.xiaoliu      = new XiaoliuNamespace(options);
    this.taiyi        = new TaiyiNamespace(options);
    this.nameAnalysis = new NameAnalysisNamespace(options);
    this.compatibility = new CompatibilityNamespace(options);
    this.auspicious   = new AuspiciousNamespace(options);
    this.almanac      = new AlmanacNamespace(options);
    this.divination   = new DivinationNamespace(options);
    this.astrology    = new AstrologyNamespace(options);
    this.tarot        = new TarotNamespace(options);
    this.coinFlip     = new CoinFlipNamespace(options);
    this.runes        = new RunesNamespace(options);
    this.numerology   = new NumerologyNamespace(options);
    this.zodiac       = new ZodiacNamespace(options);
    this.birthday     = new BirthdayNamespace(options);
    this.bloodtype    = new BloodtypeNamespace(options);
    this.jyotish      = new JyotishNamespace(options);
    this.ifa          = new IfaNamespace(options);
    this.vodun        = new VodunNamespace(options);
    this.hakata       = new HakataNamespace(options);
    this.rammal       = new RammalNamespace(options);
    this.anka         = new AnkaNamespace(options);
    this.khatt        = new KhattNamespace(options);
    this.tian         = new TianNamespace(options);
  }
}

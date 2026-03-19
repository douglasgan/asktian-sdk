# asktian-sdk

Official JavaScript/TypeScript SDK for the [askTIAN Metaphysics API](https://asktian.com) — 33 divination systems including Qimen Dunjia, Jyotish, Ifá, Tarot, Runes, Numerology, and TIAN Blended synthesis endpoints.

## Installation

```bash
npm install asktian-sdk
# or
pnpm add asktian-sdk
# or
yarn add asktian-sdk
```

## Quick Start

```ts
import { AskTianClient } from "asktian-sdk";

const client = new AskTianClient({ apiKey: "at_live_your_key_here" });

// Qimen Dunjia
const reading = await client.qimen.calculate({
  date: "2026-03-19",
  time: "10:00",
  question: "Should I sign the contract today?",
});

// Jyotish (Vedic Astrology)
const jyotish = await client.jyotish.calculate({
  birthdate: "1990-01-15",
  birthTime: "06:30",
  birthPlace: "Singapore",
  question: "Career prospects this year?",
});

// TIAN Global — cross-civilisational synthesis across all 5 traditions
const global = await client.tian.global({
  birthdate: "1990-01-15",
  birthTime: "06:30",
  birthPlace: "Singapore",
  question: "Should I launch my business this quarter?",
});
```

## Available Systems

### Eastern Tradition
| Method | System |
|--------|--------|
| `client.qimen.calculate(input)` | Qimen Dunjia 奇門遁甲 |
| `client.liuyao.calculate(input)` | Liu Yao 六爻 |
| `client.meihua.calculate(input)` | Meihua Yishu 梅花易數 |
| `client.daliu.calculate(input)` | Da Liu Ren 大六壬 |
| `client.xiaoliu.calculate(input)` | Xiao Liu Ren 小六壬 |
| `client.taiyi.calculate(input)` | Tai Yi Shen Shu 太乙神數 |
| `client.nameAnalysis.analyze(input)` | Chinese Name Analysis 姓名學 |
| `client.compatibility.calculate(input)` | BaZi Compatibility 八字合婚 |
| `client.auspicious.analyze(input)` | Auspicious Numbers 吉祥數字 |
| `client.almanac.get(input)` | Chinese Almanac 通書 |
| `client.divination.draw(input)` | Divination Lots 求籤 |
| `client.astrology.calculate(input)` | Chinese Astrology 紫微斗數 |

### Western Tradition
| Method | System |
|--------|--------|
| `client.tarot.draw(input)` | Tarot |
| `client.coinFlip.flip(input)` | Coin Flip Oracle |
| `client.runes.cast(input)` | Norse Runes |
| `client.numerology.calculate(input)` | Numerology |
| `client.zodiac.calculate(input)` | Western Zodiac Compatibility |
| `client.birthday.compare(input)` | Birthday Compatibility |
| `client.bloodtype.compare(input)` | Blood Type Compatibility |

### Indian Tradition
| Method | System |
|--------|--------|
| `client.jyotish.calculate(input)` | Jyotish (Vedic Astrology) |
| `client.anka.calculate(input)` | Anka Shastra (Indian Numerology) |

### African Tradition
| Method | System |
|--------|--------|
| `client.ifa.calculate(input)` | Ifá Divination |
| `client.vodun.calculate(input)` | Vodun Oracle |
| `client.hakata.calculate(input)` | Hakata (Bone Throwing) |

### Islamic Tradition
| Method | System |
|--------|--------|
| `client.rammal.calculate(input)` | Ilm al-Raml (Geomancy) |
| `client.khatt.calculate(input)` | Khatt al-Raml |

### TIAN Blended Synthesis
| Method | Traditions Combined |
|--------|---------------------|
| `client.tian.eastern(input)` | All Eastern systems |
| `client.tian.western(input)` | All Western systems |
| `client.tian.eastwest(input)` | Eastern + Western |
| `client.tian.african(input)` | All African systems |
| `client.tian.islamic(input)` | All Islamic systems |
| `client.tian.indian(input)` | All Indian systems |
| `client.tian.global(input)` | All 5 traditions — full synthesis |

## Error Handling

```ts
import { AskTianClient, AskTianError } from "asktian-sdk";

const client = new AskTianClient({ apiKey: "at_live_your_key_here" });

try {
  const result = await client.qimen.calculate({
    date: "2026-03-19",
    time: "10:00",
    question: "Should I proceed?",
  });
  console.log(result);
} catch (err) {
  if (err instanceof AskTianError) {
    console.error(`API error ${err.status}: ${err.message}`);
    // err.status: HTTP status code (401, 403, 429, etc.)
    // err.body: full error response body
  }
}
```

## Get an API Key

Visit [asktian.com](https://asktian.com) → Dashboard → API Keys. Pay with $TIAN on Base network to activate a subscription plan.

## License

MIT

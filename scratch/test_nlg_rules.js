// Test script to verify client-side NLG (Natural Language Generation) rule-based commentary.

function generateNlgCommentary(m) {
  const usSp = m.us10y3m ? m.us10y3m.value : null;
  const usChg = m.us10y3m ? m.us10y3m.change : 0;
  const krSp = m.kr10y3y ? m.kr10y3y.value : null;
  const krChg = m.kr10y3y ? m.kr10y3y.change : 0;
  
  if (usSp === null && krSp === null) return 'No Data Available';

  let usComment = '';
  let krComment = '';
  let actionGuide = '';

  // 1. 미국 금리차 국면 분석
  if (usSp !== null) {
    const trend = usChg > 0 ? '축소(우상향 개선)' : usChg < 0 ? '심화(우하향 악화)' : '보합';
    if (usSp < -0.5) {
      usComment = `🇺🇸 미국 채권 시장 장단기 역전(Inverted) 상태. 스프레드 ${usSp.toFixed(2)}%p (${trend})`;
    } else if (usSp < 0) {
      usComment = `🇺🇸 미국 채권 시장 경미한 역전 상태. 스프레드 ${usSp.toFixed(2)}%p (${trend})`;
    } else if (usSp < 0.4) {
      usComment = `🇺🇸 미국 채권 시장 평평한(Flat) 플래트닝 구간. 스프레드 ${usSp.toFixed(2)}%p (${trend})`;
    } else {
      usComment = `🇺🇸 미국 채권 시장 정상 우상향(Normal). 스프레드 ${usSp.toFixed(2)}%p (${trend})`;
    }
  }

  // 2. 한국 금리차 국면 분석
  if (krSp !== null) {
    const trend = krChg > 0 ? '스프레드 확대' : krChg < 0 ? '스프레드 축소' : '보합';
    if (krSp < 0) {
      krComment = `🇰🇷 한국 금융 시장 장단기 역전 상태. 스프레드 ${krSp.toFixed(2)}%p (${trend})`;
    } else if (krSp < 0.2) {
      krComment = `🇰🇷 한국 금융 시장 금리 수렴(Flat) 구간. 스프레드 ${krSp.toFixed(2)}%p (${trend})`;
    } else {
      krComment = `🇰🇷 한국 금융 시장 정상 스프레드. 스프레드 ${krSp.toFixed(2)}%p (${trend})`;
    }
  }

  // 3. 퀀트 자산배분 행동 가이드
  if (usSp !== null && usSp < 0) {
    actionGuide = `📌 포트폴리오 가이드: 방어적 포지션 (장기채/골드/현금)`;
  } else {
    actionGuide = `📌 포트폴리오 가이드: 적극적 수익 추구 (위험자산/성장주)`;
  }

  return { usComment, krComment, actionGuide };
}

const testCases = [
  {
    name: "Scenario A: Both highly inverted (Crisis sign)",
    data: {
      us10y3m: { value: -0.75, change: -0.05 },
      kr10y3y: { value: -0.12, change: -0.02 }
    }
  },
  {
    name: "Scenario B: Both flat (Transition phase)",
    data: {
      us10y3m: { value: 0.15, change: 0.01 },
      kr10y3y: { value: 0.08, change: 0.00 }
    }
  },
  {
    name: "Scenario C: Both normal (Stable economy)",
    data: {
      us10y3m: { value: 0.85, change: 0.03 },
      kr10y3y: { value: 0.35, change: 0.02 }
    }
  },
  {
    name: "Scenario D: Mixed (US inverted, KR normal)",
    data: {
      us10y3m: { value: -0.22, change: 0.02 },
      kr10y3y: { value: 0.40, change: -0.01 }
    }
  }
];

console.log("=== STARTING NLG COMMENTARY RULE ENGINE TEST ===\n");
testCases.forEach(tc => {
  console.log(`[${tc.name}]`);
  const res = generateNlgCommentary(tc.data);
  console.log(` - US: ${res.usComment}`);
  console.log(` - KR: ${res.krComment}`);
  console.log(` - Guide: ${res.actionGuide}`);
  console.log();
});
console.log("=== TEST COMPLETED SUCCESSFULLY ===");

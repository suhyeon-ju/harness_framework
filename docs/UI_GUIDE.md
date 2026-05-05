# UI 디자인 가이드

## 디자인 원칙
1. 도구처럼 보여야 한다. 자영업자가 매일 여는 앱 — 마케팅 페이지가 아니다.
2. 모바일 우선. 모든 핵심 액션은 엄지손가락 범위 안에 있어야 한다.
3. 군더더기 없이. 지금 해야 할 일만 보여준다. 선택지는 최소화한다.

## AI 슬롭 안티패턴 — 하지 마라
| 금지 사항 | 이유 |
|-----------|------|
| backdrop-filter: blur() | glass morphism은 AI 템플릿의 가장 흔한 징후 |
| gradient-text (배경 그라데이션 텍스트) | AI가 만든 SaaS 랜딩의 1번 특징 |
| "Powered by AI" 배지 | 기능이 아니라 장식. 사용자에게 가치 없음 |
| box-shadow 글로우 애니메이션 | 네온 글로우 = AI 슬롭 |
| 보라/인디고 브랜드 색상 | "AI = 보라색" 클리셰 |
| 모든 카드에 동일한 rounded-2xl | 균일한 둥근 모서리는 템플릿 느낌 |
| 배경 gradient orb (blur-3xl 원형) | 모든 AI 랜딩 페이지에 있는 장식 |

## 색상
### 배경
| 용도 | 값 |
|------|------|
| 페이지 | `#ffffff` (white) |
| 카드/섹션 | `#f9fafb` (gray-50) |
| 구분선/테두리 | `#e5e7eb` (gray-200) |

### 텍스트
| 용도 | 값 |
|------|------|
| 주 텍스트 | `#111827` (gray-900) |
| 본문 | `#374151` (gray-700) |
| 보조 | `#6b7280` (gray-500) |
| 비활성 | `#9ca3af` (gray-400) |

### 데이터/시맨틱 색상
| 용도 | 값 |
|------|------|
| 브랜드/CTA/오늘 강조 | `#f97316` (orange-500) |
| 업로드 완료 (초록 점) | `#22c55e` (green-500) |
| 미업로드 (주황 점) | `#f97316` (orange-500) |
| 에러 | `#ef4444` (red-500) |
| 카카오 버튼 배경 | `#FEE500` |
| 카카오 버튼 텍스트 | `#3C1E1E` |

## 컴포넌트
### 카드
```
rounded-lg bg-gray-50 border border-gray-200 p-4
```

### 버튼
```
Primary (CTA):  rounded-lg bg-orange-500 text-white py-3 px-4 hover:bg-orange-600 transition-colors
Secondary:      rounded-lg border border-gray-200 text-gray-700 py-3 px-4 hover:bg-gray-50 transition-colors
Danger:         rounded-lg text-red-500 hover:bg-red-50 transition-colors
```

### 입력 필드
```
rounded-lg bg-white border border-gray-300 px-4 py-3 text-sm focus:border-orange-400 focus:outline-none w-full
```

### 하단 탭 바
```
fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200
max-w-md mx-auto (내부 컨테이너)
```

## 레이아웃
- 전체 너비: `max-w-md mx-auto px-4` (모바일 기준)
- 정렬: 좌측 정렬 기본. 중앙 정렬은 랜딩 Hero 섹션에서만 허용
- 섹션 간 간격: `space-y-6`
- 하단 탭 바 여백: `pb-20` (탭 바 높이만큼 패딩)

## 타이포그래피
| 용도 | 스타일 |
|------|--------|
| 페이지 제목 | `text-xl font-bold text-gray-900` |
| 섹션 제목 | `text-base font-semibold text-gray-900` |
| 카드 라벨 | `text-xs font-medium text-gray-500 uppercase tracking-wide` |
| 본문 | `text-sm text-gray-700 leading-relaxed` |
| 보조 설명 | `text-xs text-gray-500` |

## 애니메이션
- 허용: `transition-colors duration-150` (버튼 hover), `transition-opacity duration-200` (로딩 페이드)
- 그 외 모든 애니메이션 금지 (슬라이드, bounce, 글로우 등)

## 아이콘
- SVG 인라인, `strokeWidth={1.5}`
- 크기: `w-5 h-5` (기본), `w-6 h-6` (탭 바)
- 아이콘 컨테이너(둥근 배경 박스)로 감싸지 않는다

# 웹 애플리케이션 성능 최적화 개발 지침서 (Web Performance Guidelines)

본 지침서는 **endpointlab**의 성능 제일주의 기술 철학을 바탕으로, 웹 서비스의 로딩 속도, 렌더링 반응성, 사용자 경험 지표를 극대화하기 위한 실천적인 프론트엔드 개발 가이드를 제공합니다.

---

## 1. Core Web Vitals 최적화

Core Web Vitals는 Google이 사용자 경험을 측정하는 3가지 핵심 지표입니다. 모든 개발 단계에서 다음 기준을 만족해야 합니다.

### 1.1. LCP (Largest Contentful Paint) - 로딩 성능
> **목표:** 2.5초 이하 (Good)

LCP는 페이지 내에서 가장 큰 시각적 요소(주로 메인 이미지나 텍스트 블록)가 화면에 렌더링되는 시간을 측정합니다.

*   **히어로 이미지 LCP 최적화:**
    *   초기 뷰포트에 표시되는 LCP 이미지에는 `loading="lazy"`를 **절대 사용하지 마십시오**. 대신 `<link rel="preload">` 혹은 CSS `fetchpriority="high"` 속성을 부여하여 리소스 다운로드 우선순위를 높이십시오.
    *   차세대 이미지 포맷(AVIF, WebP)을 제공하고, 반응형 크기에 맞게 `<picture>` 태그와 `srcset`을 명시하십시오.
*   **서버 응답 시간(TTFB) 단축:**
    *   API 응답 속도를 개선하고, 가능한 정적 자원(HTML, CSS, JS)은 에지 단의 CDN에 캐싱하십시오.
    *   SSR(Server-Side Rendering) 환경인 경우 중요 데이터만 최초 HTML에 포함하고, 비중요 데이터는 클라이언트에서 지연 로드(lazy load)하십시오.

```html
<!-- 권장되는 히어로 이미지 마크업 예시 -->
<link rel="preload" fetchpriority="high" as="image" href="hero-mobile.webp" type="image/webp" media="(max-width: 768px)">
<link rel="preload" fetchpriority="high" as="image" href="hero-desktop.webp" type="image/webp" media="(min-width: 769px)">
```

---

### 1.2. INP (Interaction to Next Paint) - 인터랙티브 반응성
> **목표:** 200ms 이하 (Good)

INP는 사용자가 페이지와 상호작용한 후 브라우저가 다음 프레임을 그리기까지 걸리는 최대 지연 시간을 나타냅니다. FID(First Input Delay)를 대체하는 핵심 지표입니다.

*   **메인 스레드 블로킹 해제 (Long Tasks 분할):**
    *   50ms를 초과하는 긴 자바스크립트 실행 작업(Long Task)은 `requestIdleCallback` 또는 `setTimeout`을 통해 여러 개의 작은 작업(Micro-tasks)으로 분할하십시오.
    *   최신 브라우저에서는 `scheduler.yield()` API를 활용해 자바스크립트 엔진이 브라우저 렌더링 스레드에 제어권을 양보하도록 구현하십시오.
*   **이벤트 핸들러 최적화:**
    *   스크롤, 입력창 타이핑 등 빈번히 발생하는 이벤트 핸들러에는 디바운스(Debounce) 및 스로틀(Throttle)을 적용하십시오.
    *   비동기 작업 시 무거운 DOM 변경은 `requestAnimationFrame` 내부에서 실행되도록 예약하십시오.

```javascript
// 긴 작업을 Yield 처리하는 유틸리티 예시
function yieldToMain() {
  if (globalThis.scheduler?.yield) {
    return scheduler.yield();
  }
  return new Promise(resolve => setTimeout(resolve, 0));
}

async function processLargeData(items) {
  for (let i = 0; i < items.length; i++) {
    processItem(items[i]);
    if (i % 100 === 0) {
      await yieldToMain(); // 메인 스레드 양보
    }
  }
}
```

---

### 1.3. CLS (Cumulative Layout Shift) - 시각적 안정성
> **목표:** 0.1 이하 (Good)

CLS는 페이지 로드 중 요소의 갑작스러운 위치 이동으로 발생하는 레이아웃 불안정성을 측정합니다.

*   **크기 지정 필수 (Explicit Width and Height):**
    *   모든 `<img>`, `<iframe>`, 비디오 요소에는 `width`와 `height` 속성을 명시적으로 선언하거나 CSS `aspect-ratio`를 사용해 공간을 미리 예약하십시오.
*   **동적 콘텐츠 삽입 시 스켈레톤 UI 제공:**
    *   광고나 동적 데이터 로딩 영역은 스켈레톤(Skeleton) 디자인이나 플레이스홀더를 통해 높이 값을 고정해 두어야 리소스 로드 후 레이아웃이 튀는 현상을 방지할 수 있습니다.
*   **웹 폰트 레이아웃 시프트 방지:**
    *   `font-display: swap;` 사용 시 기본 폰트에서 웹 폰트로 교체될 때 자구의 폭 차이로 레이아웃이 밀릴 수 있습니다. CSS `@font-face`에 `size-adjust`, `ascent-override`, `descent-override` 속성을 설정하여 시스템 폰트와 크기를 일치시키십시오.

```css
/* 레이아웃 시프트 방지를 위한 CSS 예시 */
.image-container img {
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9; /* 이미지 로드 전 공간 예약 */
}
```

---

## 2. 렌더링 최적화 (Critical Rendering Path)

브라우저가 HTML, CSS, JavaScript를 파싱하여 화면에 그리는 시간을 단축해야 합니다.

### 2.1. Critical CSS 및 비중요 CSS 로드
*   최초 렌더링에 반드시 필요한 스타일(Above-the-Fold 요소)은 `<style>` 태그를 이용해 HTML 내부(inline)에 포함하고, 비중요 CSS는 비동기적으로 로딩하도록 처리하십시오.

```html
<link rel="stylesheet" href="non-critical.css" media="print" onload="this.media='all'">
```

### 2.2. DOM 노드 수 관리
*   과도한 DOM 중첩은 메모리 사용량을 늘리고 스타일 계산(Recalculation) 시간을 증가시킵니다.
    *   단일 페이지 내 전체 DOM 노드는 **1,500개 미만**을 유지하십시오.
    *   중첩 깊이는 **32단계 이하**로 제한하십시오.
    *   자주 업데이트되는 스크롤 리스트 영역에는 CSS `content-visibility: auto;`를 적용하여 뷰포트 외부 노드의 렌더링 연산을 생략하십시오.

---

## 3. 에셋 최적화 및 네트워크 로딩 전략

### 3.1. 웹 폰트 최적화
*   폰트 포맷은 압축률이 가장 우수한 **WOFF2** 형식을 기본으로 채택하십시오.
*   자주 쓰이는 주요 영문/숫자/한글 음절만 포함한 **서브셋 폰트(Subset Font)**를 별도로 빌드하여 파일 크기를 80% 이상 줄이십시오.

### 3.2. 자바스크립트 로딩 전략
*   자바스크립트 리소스는 브라우저 파싱을 방해(Parser-blocking)하지 않도록 `<script defer>` 혹은 `async` 속성을 적절히 부여해야 합니다.
    *   실행 순서가 보장되어야 하는 앱 핵심 로직은 `defer`를 사용합니다.
    *   외부 분석 스크립트 등 독립적인 라이브러리는 `async`를 활용합니다.

```html
<script defer src="app.js"></script>
```

### 3.3. 캐싱 및 전송 압축
*   서버 응답 헤더에 강력한 브라우저 캐싱 정책(`Cache-Control: max-age=31536000, immutable`)을 선언하십시오.
*   모든 텍스트 리소스(HTML, CSS, JS)는 서버 또는 CDN 설정에서 **Brotli** 압축 방식을 우선 적용하고, 미지원 브라우저 대응을 위해 **Gzip**을 fallback으로 지정하십시오.

---

## 4. endpointlab 성능 측정 검증 체크리스트

모든 릴리즈 전 단계에서 아래 기준을 준수하고 측정 결과를 증명해야 합니다.

| 측정 항목 | 권장 기준 | 측정 방식 |
| :--- | :--- | :--- |
| **LCP (Largest Contentful Paint)** | 2.5s 이하 | Lighthouse / Web Vitals API |
| **INP (Interaction to Next Paint)** | 200ms 이하 | Chrome DevTools Performance Panel |
| **CLS (Cumulative Layout Shift)** | 0.1 이하 | Lighthouse / Layout Instability API |
| **Lighthouse Performance Score** | 98점 이상 | Chrome DevTools Audit |
| **Total DOM Nodes** | 1,500개 이하 | Console `document.getElementsByTagName('*').length` |
| **Critical Resource Size** | 200KB 이하 | Network Tab (Brotli Compressed) |

> "측정하지 않으면 개선할 수 없고, 성능을 포기하는 것은 사용자를 포기하는 것과 같다." — *endpointlab Engineering Team*

# 소소마켓 프론트엔드

> **日本語・JPYストア**: サイト表示、認証メール、APIエラー、管理画面は日本語、通貨はJPY固定です。[日本語の設定手順](../back/docs/JAPANESE_SETUP.md)

Vue 3 + Vite + TypeScript + Vue Router 기반의 쇼핑몰 MVP입니다. Spring Boot와 DB에 연결해 회원·상품·장바구니·주문·포인트를 관리합니다.

백엔드는 Spring Data JPA를 사용하며 Controller → Service → Repository → Entity로 분리되어 있습니다. 기존 API를 유지하므로 프론트 실행 방식은 같습니다. [JPA 구조 안내](../back/docs/JPA_STRUCTURE.md)

## 실행

1. Node.js 22.12 이상(또는 20.19 이상)을 설치합니다. Node.js 설치 시 npm도 함께 설치합니다.
2. pnpm이 없다면 `npm.cmd install --global pnpm@11.25.0`으로 설치한 뒤 터미널을 다시 엽니다. 이 front 폴더에서 `pnpm install`을 실행합니다.
3. 별도 IntelliJ 창에서 `../back/pom.xml`을 열고 JDK 21로 ShoppingMallApplication을 실행합니다. Oracle 최초 설정은 [백엔드 실행 안내](../back/README.md)를 따릅니다. Oracle 연결 전에는 Active profiles를 `demo`로 지정해 H2 파일 DB로 확인할 수 있습니다.
4. front 폴더에서 `pnpm dev`를 실행합니다.
5. http://localhost:5173 으로 접속합니다.

## 명령어

- `pnpm dev`: 개발 서버
- `pnpm type-check`: Vue 컴포넌트·TypeScript 타입 검사
- `pnpm build`: 타입 검사 후 dist 폴더에 배포 파일 생성
- `pnpm preview`: 빌드한 프론트 화면 확인. API는 별도 서버 연결 설정이 필요합니다.

PowerShell에서 스크립트 실행 정책 오류가 나면 `pnpm.cmd install`, `pnpm.cmd dev`처럼 실행하세요.

## 구조

- `src/App.vue`: 공통 메뉴·알림·RouterView
- `src/router/index.ts`: URL별 페이지, 로그인·관리자 접근 검사
- `src/views/`: 라우트별 화면과 이동 처리
- `src/types/api.ts`: 회원·상품·주문·장바구니·포인트·리뷰 및 요청 타입
- `src/components/`: 회원·상품·상세/리뷰·장바구니/주문서·주문내역·포인트·관리자 화면
- `src/composables/useShop.ts`: 인증 상태, 데이터 조회, 사용자 동작
- `src/api/http.ts`: API 호출, 세션 쿠키, CSRF 토큰
- `src/utils/format.ts`: 금액/일시 표시
- `src/styles.css`: 반응형 화면 스타일
- `vite.config.ts`: 개발 서버 및 /api → localhost:8080 프록시
- `../back`: Spring Boot Maven 프로젝트 및 백엔드 실행 안내

## 기능

- 이메일 인증번호 발송·확인 후 회원가입·로그인·로그아웃, 관리자 메뉴 분리
- 상품 검색·카테고리·가격순 정렬·상세 보기, 구매자 리뷰
- 계정별 DB 장바구니·수량 변경·삭제·찜 목록
- 배송지·포인트 사용·모의 카드/간편결제 → 주문 내역
- 주문 전체 취소, 포인트 적립/사용/환급/회수 원장
- 관리자 상품 등록·수정·판매 중단, 재고·이미지 URL 관리

**모의 결제만 지원합니다. 실제 카드 결제나 PayPay 연결, 카드 정보 입력, 실제 금액 청구는 없습니다.**
금액은 엔화(JPY) 고정이며 결제액의 1% 적립(정수 버림), 1 P = 1엔, 무료 배송입니다. 통화 설정이나 통화에 따른 구매 제한은 없습니다. 적립 포인트 사용 후 원래 주문을 취소하면 포인트 잔액이 음수가 될 수 있으며 이후 적립으로 상계합니다. 이전 V3에서 추가한 불필요한 DB 컬럼은 V4 SQL로 정리할 수 있습니다.
모든 영속 데이터는 백엔드 DB에 보관합니다. 서버 재시작 시 세션은 만료되어 다시 로그인해야 합니다.
장바구니의 가격과 재고는 결제 시 서버의 최신 데이터로 검증합니다.
상품 이미지는 이모지 또는 관리자가 입력한 HTTPS URL이며 파일 업로드는 포함하지 않습니다.
운영 배포 시 정적 파일과 /api를 같은 출처로 제공하도록 reverse proxy를 구성해야 합니다.

## 확인 순서

이메일 인증번호 발송·확인 → 회원가입 → 상품 찜/장바구니 → 새로고침 → 장바구니에서 배송지/모의 수단 입력 → 모의 결제 → 주문 내역/마이페이지 확인 → 주문 취소.
Gmail 발송 계정의 앱 비밀번호는 IntelliJ의 백엔드 환경변수에 설정합니다. [Gmail 설정 안내](../back/docs/GMAIL_SETUP.md)를 참고하세요. 기존 Oracle DB에는 V2 이메일 인증 SQL이 필요합니다.
관리자는 백엔드의 MALL_ADMIN_EMAIL/PASSWORD 환경변수로 최초 생성합니다. 일반 회원가입으로는 관리자가 될 수 없습니다.
DB 구조/API/정책은 [구현 문서](../back/docs/ARCHITECTURE.md)를 참고하세요.

## 자동화 테스트

백엔드에서 Maven `verify`로 실행 JAR을 만든 뒤, JDK 21의 JAVA_HOME을 지정하고 front에서 `pnpm test:e2e`를 실행합니다.
기본 브라우저는 설치된 Microsoft Edge입니다. 테스트는 5174/18080 포트 및 테스트 전용 SMTP/메일함 11025/18081 포트를 사용하며, 별도 H2 메모리 DB에서 실행됩니다. Oracle 및 demo 파일 DB의 데이터는 사용하지 않습니다. 테스트 메일은 외부로 전송하지 않습니다.
Edge가 없으면 `pnpm exec playwright install chromium` 후 `E2E_BROWSER=chromium` 환경변수를 지정합니다.
테스트 서버와 브라우저는 완료 시 종료됩니다. 실패 스크린샷과 trace는 `.test-results`에 저장됩니다.


## TypeScript와 페이지 이동

모든 Vue 컴포넌트는 `<script setup lang="ts">`를 사용하며 props와 이벤트에도 타입을 지정했습니다. `src/types/api.ts`는 백엔드 DTO에 맞춘 JSON 계약이며, 예를 들어 `api<Product[]>('/products')`는 상품 배열을 반환합니다. TypeScript는 개발·빌드 시 타입을 검사하며, 서버에서 온 JSON을 실행 시점에 검증하는 기능은 별도입니다. 백엔드 DTO가 바뀌면 이 타입과 호출부를 함께 수정하세요.

| URL | 화면 | 접근 |
| --- | --- | --- |
| `/` | 상품 목록 | 전체 |
| `/products/:id` | 주소로 열 수 있는 상품 상세·리뷰 모달 | 전체 |
| `/login`, `/register` | 로그인·이메일 인증 회원가입 | 전체 |
| `/favorites` | 찜 목록 | 로그인 |
| `/cart` | 장바구니·주문서 | 로그인 |
| `/orders` | 주문 내역 | 로그인 |
| `/account` | 회원 정보·포인트 | 로그인 |
| `/admin/products` | 상품 CRUD | 관리자 |

로그인이 필요한 URL은 로그인 후 원래 주소로 돌아갑니다. 일반 회원이 관리자 URL을 직접 입력하면 권한 안내를 표시합니다. 백엔드의 권한 검사도 그대로 적용됩니다. 메뉴는 RouterLink, 각 화면은 RouterView로 연결되며 로그인·장바구니 등 상태는 단일 useShop 인스턴스에서 공유합니다. 새로고침 시 서버 세션 확인이 끝난 뒤 접근 권한을 판단합니다. 없는 URL과 없는 상품에는 안내 화면을 표시합니다.

`createWebHistory`를 사용하므로 운영 웹 서버는 `/api` 요청을 백엔드로 전달하고, 프론트의 `/orders` 같은 경로는 `index.html`로 fallback해야 합니다. 그래야 주소 직접 입력과 새로고침이 동작합니다. Vite 개발 서버는 이 기능을 제공합니다.

VS Code에서는 **Vue - Official** 확장을 권장합니다. 실행 명령은 기존과 같은 `pnpm.cmd dev`입니다. 타입 검사는 `pnpm.cmd type-check`, 배포 빌드는 `pnpm.cmd build`로 실행하세요.

# 위키 & 문서 모듈 규칙

## 1. 위키 페이지 구조
- 프로젝트별 독립된 위키 공간
- 페이지 간 **트리 구조** (parentPageId)
- URL: `/projects/{identifier}/wiki/{slug}`
- Slug: 타이틀에서 자동 생성 (영문 kebab-case, 한글은 encodeURI)

## 2. 위키 에디터 (Tiptap)
- **WYSIWYG 모드** 기본 (TipTap 에디터)
- Markdown 원본 편집 모드 토글 가능
- 지원 기능: 헤딩, 볼드, 이탤릭, 코드블록, 표, 이미지, 링크, 목록, 체크리스트
- 저장 시 Content는 **HTML** 형태로 DB 저장 (Tiptap 기본 출력)
- 내부 위키 링크: `[[페이지제목]]` 문법 지원 (커스텀 Tiptap Extension)

## 3. 버전 관리
- 저장할 때마다 `WikiPageVersion` 레코드 생성
- `WikiPage.Version` 필드 +1 증가
- 버전 히스토리 조회: `GET /api/projects/{id}/wiki/{slug}/versions`
- 특정 버전 조회: `GET /api/projects/{id}/wiki/{slug}/versions/{version}`
- 버전 간 diff: 프론트엔드에서 텍스트 diff 라이브러리 사용

## 4. 첨부파일
- 위키 페이지에 이미지/파일 첨부 가능
- `Attachment` 엔티티의 `AttachableType="WikiPage"`, `AttachableId=wikiPageId`
- 에디터 내 이미지 업로드: Tiptap Image Extension + Attachment API 연동
- 드래그 앤 드롭 업로드 지원

## 5. 문서 (Document) 모듈
- 위키와 별도: 파일 첨부 중심의 문서 보관소
- 카테고리별 분류 (문자열 기반, 자유 입력)
- 문서당 여러 첨부파일 가능

## 6. 보안 주의사항
- **HTML sanitize 필수**: 위키 Content를 렌더링할 때 XSS 방지
- Tiptap 출력은 기본적으로 안전하지만, DB에서 불러올 때 `DOMPurify`로 sanitize
- 파일 업로드 시 허용 확장자 제한, 파일 크기 제한 (50MB)

---

## 오류 기록

| 날짜 | 오류 내용 | 원인 | 해결책 | 방지 규칙 |
|------|-----------|------|--------|-----------|
| 2026-04-07 | 문서 상세 API 404 — 프론트가 `/api/documents/{id}` 호출하지만 백엔드는 `/api/projects/{identifier}/documents/{id}` | 프론트엔드 API 경로가 백엔드 라우트와 불일치 | 프론트 API 경로를 `/projects/{identifier}/documents/{id}`로 수정 | API 호출 경로는 항상 백엔드 컨트롤러 Route 속성과 대조 확인 |
| 2026-04-07 | 문서 상세에서 파일 업로드 버튼 클릭 시 무반응 | useCallback의 uploadFiles 의존성이 stale closure로 빈 배열 참조 | useCallback 제거하고 일반 async 함수로 변경 | useCallback 내에서 자주 변하는 state를 의존성으로 쓸 때 stale closure 주의, 단순한 경우 useCallback 불필요 |
| 2026-04-07 | multipart/form-data 업로드 실패 | axios에 `headers: {'Content-Type':'multipart/form-data'}`를 수동 설정하면 boundary 자동 생성이 안됨 | Content-Type 헤더를 제거하고 axios가 FormData에서 자동 설정하도록 위임 | FormData 전송 시 Content-Type을 수동 설정하지 않는다 — axios가 자동 처리 |
| 2026-04-07 | 파일 업로드 성공(201)인데 UI에 안 보임 | DocumentDto에 attachments 필드 없음 — API 응답에 첨부파일 목록이 포함되지 않음 | DocumentService에서 문서 상세 조회 시 Attachment 목록도 함께 반환하도록 수정 | 첨부파일이 있는 엔티티의 상세 DTO에는 반드시 attachments 목록 포함 |
| 2026-04-07 | 첨부파일명 표시 안 됨 + NaN MB | 프론트엔드 타입 정의와 백엔드 DTO 필드명 불일치 (프론트 타입이 백엔드 응답 구조와 다름) | 프론트엔드 타입을 백엔드 응답과 일치시키기 | API 응답 DTO 변경 시 프론트엔드 타입도 반드시 동기화 |

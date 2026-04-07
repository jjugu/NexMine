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
| - | - | - | - | - |

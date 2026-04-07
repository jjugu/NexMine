function toLocalDate(dateStr: string): Date {
  // Backend stores UTC without Z suffix — append Z so JS parses as UTC
  const s = dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z';
  return new Date(s);
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  // DateOnly (YYYY-MM-DD) should display as-is, not timezone-shifted
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-');
    return `${y}. ${m}. ${d}.`;
  }
  return toLocalDate(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '-';
  return toLocalDate(dateStr).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getPriorityColor(
  priorityName?: string | null,
): 'error' | 'warning' | 'info' | 'default' {
  if (!priorityName) return 'default';
  const name = priorityName.toLowerCase();
  if (name === 'immediate' || name === '긴급') return 'error';
  if (name === 'urgent' || name === '매우높음') return 'error';
  if (name === 'high' || name === '높음') return 'warning';
  if (name === 'normal' || name === '보통') return 'info';
  // Low
  return 'default';
}

export function getPrioritySxColor(priorityName?: string | null): string {
  if (!priorityName) return 'grey.500';
  const name = priorityName.toLowerCase();
  if (name === 'immediate' || name === '긴급') return 'error.main';
  if (name === 'urgent' || name === '매우높음') return '#ed6c02';
  if (name === 'high' || name === '높음') return '#ffa000';
  if (name === 'normal' || name === '보통') return 'info.main';
  return 'grey.500';
}

export function getStatusColor(
  isClosed?: boolean,
): 'success' | 'default' {
  return isClosed ? 'default' : 'success';
}

export const ACTIVITY_TYPE_LABELS: Record<number, string> = {
  0: '설계',
  1: '개발',
  2: '테스트',
  3: '문서',
  4: '기타',
};

export const VERSION_STATUS_LABELS: Record<number, string> = {
  0: '열림',
  1: '잠김',
  2: '닫힘',
};

export const PROPERTY_NAME_LABELS: Record<string, string> = {
  StatusId: '상태',
  TrackerId: '트래커',
  PriorityId: '우선순위',
  AssignedToId: '담당자',
  CategoryId: '카테고리',
  VersionId: '대상 버전',
  Subject: '제목',
  Description: '설명',
  StartDate: '시작일',
  DueDate: '종료일',
  EstimatedHours: '예상 시간',
  DoneRatio: '진행률',
  IsPrivate: '비공개',
  ParentIssueId: '상위 이슈',
};

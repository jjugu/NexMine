import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryState, TableSkeleton, KanbanSkeleton } from '../components/common/QueryState';

describe('QueryState', () => {
  it('should show skeleton when loading', () => {
    render(
      <QueryState isLoading isError={false} isEmpty={false}>
        <div>Content</div>
      </QueryState>,
    );
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('should show error with retry button', () => {
    const onRetry = vi.fn();
    render(
      <QueryState
        isLoading={false}
        isError
        isEmpty={false}
        onRetry={onRetry}
        errorMessage="데이터 로드 실패"
      >
        <div>Content</div>
      </QueryState>,
    );
    expect(screen.getByText('데이터 로드 실패')).toBeInTheDocument();
    expect(screen.getByText('재시도')).toBeInTheDocument();

    fireEvent.click(screen.getByText('재시도'));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('should show empty state when isEmpty is true', () => {
    render(
      <QueryState
        isLoading={false}
        isError={false}
        isEmpty
        emptyState={<div>비어있음</div>}
      >
        <div>Content</div>
      </QueryState>,
    );
    expect(screen.getByText('비어있음')).toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('should show children when data is loaded', () => {
    render(
      <QueryState isLoading={false} isError={false} isEmpty={false}>
        <div>Content</div>
      </QueryState>,
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should show error without retry button when onRetry not provided', () => {
    render(
      <QueryState isLoading={false} isError isEmpty={false}>
        <div>Content</div>
      </QueryState>,
    );
    expect(screen.queryByText('재시도')).not.toBeInTheDocument();
  });
});

describe('TableSkeleton', () => {
  it('should render skeleton rows', () => {
    const { container } = render(<TableSkeleton rows={3} columns={4} />);
    // MUI Skeleton renders spans with class MuiSkeleton-root
    const skeletons = container.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

describe('KanbanSkeleton', () => {
  it('should render skeleton columns', () => {
    const { container } = render(<KanbanSkeleton columns={3} />);
    const skeletons = container.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

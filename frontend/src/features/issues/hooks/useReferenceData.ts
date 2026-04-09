import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../../api/axiosInstance';
import type {
  TrackerDto,
  IssueStatusDto,
  IssuePriorityDto,
  IssueCategoryDto,
  VersionDto,
  ProjectMemberDto,
} from '../../../api/generated/model';

export function useTrackers() {
  return useQuery({
    queryKey: ['trackers'],
    queryFn: () =>
      axiosInstance.get<TrackerDto[]>('/Trackers').then((res) => res.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useIssueStatuses() {
  return useQuery({
    queryKey: ['issue-statuses'],
    queryFn: () =>
      axiosInstance
        .get<IssueStatusDto[]>('/issue-statuses')
        .then((res) => res.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useIssuePriorities() {
  return useQuery({
    queryKey: ['issue-priorities'],
    queryFn: () =>
      axiosInstance
        .get<IssuePriorityDto[]>('/issue-priorities')
        .then((res) => res.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategories(identifier: string | undefined) {
  return useQuery({
    queryKey: ['categories', identifier],
    queryFn: () =>
      axiosInstance
        .get<IssueCategoryDto[]>(`/projects/${identifier}/categories`)
        .then((res) => res.data),
    enabled: !!identifier,
    staleTime: 5 * 60 * 1000,
  });
}

export function useVersions(identifier: string | undefined) {
  return useQuery({
    queryKey: ['versions', identifier],
    queryFn: () =>
      axiosInstance
        .get<VersionDto[]>(`/projects/${identifier}/versions`)
        .then((res) => res.data),
    enabled: !!identifier,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProjectMembers(identifier: string | undefined) {
  return useQuery({
    queryKey: ['project-members', identifier],
    queryFn: () =>
      axiosInstance
        .get<ProjectMemberDto[]>(`/projects/${identifier}/members`)
        .then((res) => res.data),
    enabled: !!identifier,
    staleTime: 5 * 60 * 1000,
  });
}

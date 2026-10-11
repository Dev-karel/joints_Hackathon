import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchCourses, fetchMyCourseIds, saveMyCourses } from './api';

export const myCoursesKey = (userId: string | undefined) => ['my-courses', userId] as const;

export function useCourses() {
  return useQuery({ queryKey: ['courses'], queryFn: fetchCourses, staleTime: 5 * 60_000 });
}

export function useMyCourseIds(userId: string | undefined) {
  return useQuery({
    queryKey: myCoursesKey(userId),
    enabled: !!userId,
    queryFn: () => fetchMyCourseIds(userId!),
  });
}

export function useSaveMyCourses(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveMyCourses,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: myCoursesKey(userId) }),
  });
}

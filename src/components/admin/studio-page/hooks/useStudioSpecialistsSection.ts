"use client";

import { useMemo, useState } from "react";
import type { Teacher } from "@/lib/cms/types";
import { STUDIO_SPECIALISTS_PAGE_SIZE } from "../constants";
import { paginateTeachers } from "../utils/teachers";

export function useStudioSpecialistsSection(teachers: Teacher[], pageSize = STUDIO_SPECIALISTS_PAGE_SIZE) {
  const [page, setPage] = useState(1);

  const pagination = useMemo(
    () => paginateTeachers(teachers, page, pageSize),
    [page, pageSize, teachers],
  );

  const stats = useMemo(() => {
    const published = teachers.filter((teacher) => teacher.status === "published").length;
    const draft = teachers.filter((teacher) => teacher.status === "draft").length;
    return {
      total: teachers.length,
      published,
      draft,
    };
  }, [teachers]);

  return {
    page: pagination.page,
    setPage,
    totalPages: pagination.totalPages,
    pageItems: pagination.items,
    total: pagination.total,
    stats,
    showPagination: pagination.totalPages > 1,
  };
}

import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

export function useSearchParams() {
  const route = useRoute();
  const router = useRouter();

  const searchQuery = ref(route.query.q?.toString() || "");
  const sortBy = ref(route.query.sort?.toString() || "created");
  const filterBy = ref(route.query.filter?.toString() || "all");
  const page = ref(Number(route.query.page) || 1);
  const itemsPerPage = 10;

  const updateSearchParams = () => {
    const query: Record<string, string> = {};
    if (searchQuery.value) query.q = searchQuery.value;
    if (sortBy.value !== "created") query.sort = sortBy.value;
    if (filterBy.value !== "all") query.filter = filterBy.value;
    if (page.value > 1) query.page = page.value.toString();

    router.replace({ query });
  };

  watch([searchQuery, sortBy, filterBy, page], updateSearchParams, {
    deep: true,
  });

  return {
    searchQuery,
    sortBy,
    filterBy,
    page,
    itemsPerPage,
  };
}

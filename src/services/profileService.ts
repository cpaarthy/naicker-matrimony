import { supabase } from "../lib/supabase";
import { SearchFilter } from "../components/SearchFilters";

export async function searchProfiles(filters: Partial<SearchFilter>) {
  let query = supabase
    .from("profiles")
    .select("*");

  // Age
  if (filters.ageFrom !== undefined && filters.ageFrom !== "") {
    query = query.gte("age", Number(filters.ageFrom));
  }

  if (filters.ageTo !== undefined && filters.ageTo !== "") {
    query = query.lte("age", Number(filters.ageTo));
  }

  // Height
  if (filters.heightFrom !== undefined && filters.heightFrom !== "") {
    query = query.gte("height_cm", Number(filters.heightFrom));
  }

  if (filters.heightTo !== undefined && filters.heightTo !== "") {
    query = query.lte("height_cm", Number(filters.heightTo));
  }

  // District
  if (filters.district) {
    query = query.eq("district", filters.district);
  }

  // Education
  if (filters.education) {
    query = query.eq("education", filters.education);
  }

  // Occupation
  if (filters.occupation) {
    query = query.eq("occupation", filters.occupation);
  }

  // Salary
  if (filters.salary !== undefined && filters.salary !== "") {
    query = query.gte("annual_income", Number(filters.salary));
  }

  // Star
  if (filters.star) {
    query = query.eq("star", filters.star);
  }

  // Rasi
  if (filters.rasi) {
    query = query.eq("rasi", filters.rasi);
  }

  query = query.order("created_at", {
    ascending: false,
  });

  return await query;
}
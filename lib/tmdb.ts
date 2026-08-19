const TMDB_API_BASE_URL = "https://api.themoviedb.org/3";

export type SearchResult = {
  id: number;
  mediaType: "movie" | "tv";
  title: string;
  posterPath: string | null;
  year: string | null;
};

type TmdbSearchMultiResponseResult = {
  id: number;
  media_type: string;
  poster_path: string | null;
  title?: string;
  release_date?: string;
  name?: string;
  first_air_date?: string;
};

type TmdbSearchMultiResponse = {
  results: TmdbSearchMultiResponseResult[];
};

function normalizeResult(
  result: TmdbSearchMultiResponseResult,
): SearchResult | null {
  if (result.media_type === "movie") {
    return {
      id: result.id,
      mediaType: "movie",
      title: result.title ?? "",
      posterPath: result.poster_path,
      year: result.release_date ? result.release_date.slice(0, 4) : null,
    };
  }

  if (result.media_type === "tv") {
    return {
      id: result.id,
      mediaType: "tv",
      title: result.name ?? "",
      posterPath: result.poster_path,
      year: result.first_air_date ? result.first_air_date.slice(0, 4) : null,
    };
  }

  return null;
}

export async function searchMulti(query: string): Promise<SearchResult[]> {
  if (!query) {
    return [];
  }

  const apiToken = process.env.TMDB_API_TOKEN;
  if (!apiToken) {
    throw new Error("TMDB_API_TOKEN is not set");
  }

  const url = new URL(`${TMDB_API_BASE_URL}/search/multi`);
  url.searchParams.set("query", query);
  url.searchParams.set("include_adult", "false");

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`TMDB request failed with status ${response.status}`);
  }

  const data = (await response.json()) as TmdbSearchMultiResponse;

  return data.results
    .map(normalizeResult)
    .filter((result): result is SearchResult => result !== null);
}

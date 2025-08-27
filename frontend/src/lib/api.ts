export async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`Fetch error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}
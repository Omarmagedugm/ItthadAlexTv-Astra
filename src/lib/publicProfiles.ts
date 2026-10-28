export async function fetchPublicProfiles(options: { ids?: string[]; count?: number; mode?: 'runner' | 'zombie' } = {}, signal?: AbortSignal) {
  const query = new URLSearchParams();
  if (options.ids) query.set('ids', options.ids.join(','));
  if (options.count) query.set('count', String(options.count));
  if (options.mode) query.set('mode', options.mode);
  const response = await fetch(`/api/public-profiles?${query}`, { signal });
  if (!response.ok) throw new Error('profiles-unavailable');
  const result = await response.json();
  if (!Array.isArray(result.profiles)) throw new Error('invalid-profiles');
  return result.profiles as any[];
}

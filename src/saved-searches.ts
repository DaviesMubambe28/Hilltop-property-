import type { SearchFilters } from './types';
export function savedSearchName(value:string):string{const name=value.trim();if(name.length<2||name.length>120)throw new Error('Search name must be between 2 and 120 characters.');return name;}
export function persistedSearchFilters(filters:SearchFilters):Omit<SearchFilters,'page'|'pageSize'>{const persistent={...filters} as Partial<SearchFilters>;delete persistent.page;delete persistent.pageSize;return persistent;}

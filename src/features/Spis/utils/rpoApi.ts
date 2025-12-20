export type Address = {
  street?: string;
  buildingNumber?: string;
  postalCode?: string;
  municipality?: string;
};

export type RpoEntity = {
  id: string;
  name: string;
  ico?: string;
  dic?: string;
  address?: Address;
};

const BASE_URL = 'https://api.statistics.sk/rpo/v1';

export async function searchRpoEntitiesByName(query: string): Promise<RpoEntity[]> {
  if (!query || query.length < 3) return [];

  // Check if query is numeric (IČO)
  const isNumeric = /^\d+$/.test(query);
  
  const params = new URLSearchParams({
    limit: '10',
  });

  if (isNumeric) {
    params.append('identifier', query);
  } else {
    params.append('fullName', query);
  }

  try {
    const res = await fetch(`${BASE_URL}/search?${params.toString()}`);
    if (!res.ok) {
      console.error('RPO search failed', res.status);
      return [];
    }

    const data = await res.json();
    const results = data.results || [];

    return results.map((item: any) => {
      // Find active name (no validTo or validTo in future)
      const nameObj = item.fullNames?.find((n: any) => !n.validTo) || item.fullNames?.[0];
      const name = nameObj?.value || '';

      // Find active identifier (IČO)
      const idObj = item.identifiers?.find((i: any) => !i.validTo) || item.identifiers?.[0];
      const ico = idObj?.value;

      // Find active address
      const addrObj = item.addresses?.find((a: any) => !a.validTo) || item.addresses?.[0];
      
      const address: Address | undefined = addrObj ? {
        street: addrObj.street,
        buildingNumber: addrObj.buildingNumber,
        postalCode: addrObj.postalCodes?.[0],
        municipality: addrObj.municipality?.value
      } : undefined;

      return {
        id: String(item.id),
        name,
        ico,
        dic: '', // DIČ is not available in the public RPO API response
        address
      };
    });
  } catch (error) {
    console.error('RPO search error', error);
    return [];
  }
}

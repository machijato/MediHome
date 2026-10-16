import { supabase } from './supabase';

const BUCKET = 'listing-images';
const PUBLIC_URL_MARKER = `/${BUCKET}/`;

// Putanja datoteke u bucketu: iz stupca storage_path, a za starije retke iz javnog URL-a.
const toStoragePath = (row: { storage_path?: string | null; image_url?: string | null }): string | null => {
  if (row.storage_path) {
    return row.storage_path;
  }
  const url = row.image_url ?? '';
  const markerIndex = url.indexOf(PUBLIC_URL_MARKER);
  if (markerIndex === -1) {
    return null;
  }
  return decodeURIComponent(url.slice(markerIndex + PUBLIC_URL_MARKER.length));
};

// Briše datoteke slika oglasa iz storagea. Treba ga pozvati PRIJE brisanja retka oglasa
// (pravilo za brisanje provjerava vlasništvo preko oglasa). Greške se samo zabilježe.
export async function removeListingImageFiles(listingId: string): Promise<void> {
  const { data: rows, error } = await supabase
    .from('listing_images')
    .select('storage_path, image_url')
    .eq('listing_id', listingId);

  if (error) {
    console.error('Greška pri dohvaćanju slika oglasa za brisanje datoteka:', error);
    return;
  }

  const paths = (rows ?? [])
    .map(toStoragePath)
    .filter((path): path is string => Boolean(path));

  if (paths.length === 0) {
    return;
  }

  const { error: removeError } = await supabase.storage.from(BUCKET).remove(paths);
  if (removeError) {
    console.error('Greška pri brisanju datoteka slika iz storagea:', removeError);
  }
}

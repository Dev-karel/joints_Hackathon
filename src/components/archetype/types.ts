// Bentuk data ilustrasi archetype hasil konversi SVG (lihat art/*.ts yang dihasilkan skrip).
export type ArchetypeArtData = {
  /** [x, y, lebar, tinggi] area gambar yang sudah dipangkas ke batas isi. */
  viewBox: [number, number, number, number];
  /** Warna tinta asli desain. */
  color: string;
  /** [1, d] = bentuk tinta (tampil), [0, d] = lubang (menghapus). Urutan = urutan gambar. */
  ops: [0 | 1, string][];
};

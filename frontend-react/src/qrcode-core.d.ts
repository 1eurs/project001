// Pure, browser-safe QR encoder core (the package "main" is a Node build that
// pulls fs/canvas; this subpath only needs the matrix). @types/qrcode types the
// main module, not this subpath, so we declare the slice we use.
declare module 'qrcode/lib/core/qrcode.js' {
  export interface BitMatrix {
    size: number;
    data: Uint8Array;
    get(row: number, col: number): number;
  }
  export interface QRData {
    modules: BitMatrix;
  }
  export function create(
    data: string,
    options?: { errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'; version?: number },
  ): QRData;
}

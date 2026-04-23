import '@testing-library/jest-dom/vitest';
import React from 'react';
import { vi } from 'vitest';

vi.mock('next/image', () => ({
  default: ({
    alt,
    src,
    unoptimized: _unoptimized,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    src: string | { src: string };
    unoptimized?: boolean;
  }) => (
    void _unoptimized,
    React.createElement('img', {
      alt,
      src: typeof src === 'string' ? src : src.src,
      ...props
    })
  )
}));

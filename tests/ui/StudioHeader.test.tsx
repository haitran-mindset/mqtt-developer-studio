import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StudioHeader } from '@/app/layout/StudioHeader';

describe('StudioHeader', () => {
  it('renders brand and navigation tab buttons', () => {
    const { unmount } = render(<StudioHeader />);

    expect(screen.getByText('STUDIO')).toBeInTheDocument();
    expect(screen.getByText('Brokers')).toBeInTheDocument();
    expect(screen.getByText('Publisher')).toBeInTheDocument();
    expect(screen.getByText('Live Stream')).toBeInTheDocument();
    expect(screen.getByText('Workflows')).toBeInTheDocument();

    const consoleBtn = screen.getByTitle('Toggle Console Log Panel');
    expect(consoleBtn).toBeInTheDocument();

    unmount();
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Button } from '../button'; // Adjust the import path as needed

describe('Button', () => {
  it('renders correctly with default props', () => {
    render(<Button>Test Button</Button>);
    expect(screen.getByText('Test Button')).toBeInTheDocument();
  });

  it('renders correctly with a variant prop', () => {
    render(<Button variant="destructive">Destructive Button</Button>);
    expect(screen.getByText('Destructive Button')).toBeInTheDocument();
    // You can add more specific assertions for classes if needed
    expect(screen.getByText('Destructive Button')).toHaveClass('bg-destructive');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Clickable Button</Button>);
    screen.getByText('Clickable Button').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

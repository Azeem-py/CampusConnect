import { render, screen } from '@testing-library/react';
import App from './App';
import { expect, test } from 'vitest';
import '@testing-library/jest-dom';

test('renders app header', () => {
  render(<App />);
  const headerElement = screen.getByText(/CampusConnect/i);
  expect(headerElement).toBeInTheDocument();
});

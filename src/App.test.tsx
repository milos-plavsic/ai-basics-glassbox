import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the glassbox workspace', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /ai basics glassbox/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /run/i })).toBeInTheDocument();
    expect(screen.getByText(/chunking inspector/i)).toBeInTheDocument();
    expect(screen.getByText(/answer comparison/i)).toBeInTheDocument();
  });

  it('updates the prompt after editing the question and running', async () => {
    const user = userEvent.setup();
    render(<App />);

    const question = screen.getByLabelText(/question/i);
    await user.clear(question);
    await user.type(question, 'Are shipping fees refunded for damaged orders?');
    await user.click(screen.getByRole('button', { name: /run/i }));

    expect(screen.getAllByText(/Are shipping fees refunded for damaged orders\?/)).toHaveLength(2);
    expect(screen.getAllByText(/Shipping fees/i).length).toBeGreaterThan(1);
  });
});

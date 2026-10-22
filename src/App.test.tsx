import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the glassbox workspace and explains the simulation', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /ai basics glassbox/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /run/i })).toBeInTheDocument();
    expect(screen.getByText(/chunking inspector/i)).toBeInTheDocument();
    expect(screen.getByText(/answer comparison/i)).toBeInTheDocument();
    expect(screen.getByText(/not calibrated confidence/i)).toBeInTheDocument();
  });

  it('marks results stale after an edit and refreshes every panel after Run', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole('status')).toHaveTextContent(/results match the current inputs/i);
    const question = screen.getByLabelText(/question/i);
    await user.clear(question);
    await user.type(question, 'Are shipping fees refunded for damaged orders?');
    expect(screen.getByRole('status')).toHaveTextContent(/inputs changed/i);

    await user.click(screen.getByRole('button', { name: /run/i }));
    expect(screen.getByRole('status')).toHaveTextContent(/results match the current inputs/i);
    expect(screen.getAllByText(/Are shipping fees refunded for damaged orders\?/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Shipping fees/i).length).toBeGreaterThan(1);
  });

  it('does not silently update results when source text changes', async () => {
    const user = userEvent.setup();
    render(<App />);
    const source = screen.getByLabelText(/source document/i);
    await user.clear(source);
    await user.type(source, 'Only a short fact.');
    expect(screen.getByRole('status')).toHaveTextContent(/inputs changed/i);
    expect(screen.getByText(/results still show the last run/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /run/i }));
    expect(screen.getByRole('status')).toHaveTextContent(/results match the current inputs/i);
    expect(screen.getAllByText('Only a short fact.').length).toBeGreaterThan(1);
  });

  it('resets the edited fields and reruns the selected scenario', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.clear(screen.getByLabelText(/question/i));
    await user.type(screen.getByLabelText(/question/i), 'A changed question');
    expect(screen.getByRole('status')).toHaveTextContent(/inputs changed/i);
    await user.click(screen.getByRole('button', { name: /reset scenario/i }));
    expect(screen.getByLabelText(/question/i)).toHaveValue('How does the refund policy work for a damaged order?');
    expect(screen.getByRole('status')).toHaveTextContent(/results match the current inputs/i);
  });

  it('changes scenario and updates the executed run', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.selectOptions(screen.getByLabelText(/lesson scenario/i), 'garden');
    expect(screen.getByRole('status')).toHaveTextContent(/results match the current inputs/i);
    expect(screen.getByLabelText(/question/i)).toHaveValue('Can members bring guests to weekend workshops?');
    expect(screen.getAllByText(/Weekend workshops/).length).toBeGreaterThan(1);
  });
});

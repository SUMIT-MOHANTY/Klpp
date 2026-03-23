describe('Basic test setup verification', () => {
  test('Jest is configured properly', () => {
    expect(true).toBe(true);
  });

  test('JSX rendering works', () => {
    const { render } = require('@testing-library/react');
    const React = require('react');

    function TestComponent() {
      return <div>Test Component</div>;
    }

    const { getByText } = render(<TestComponent />);
    expect(getByText('Test Component')).toBeInTheDocument();
  });
});

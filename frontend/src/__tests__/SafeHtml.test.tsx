import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SafeHtml from '../components/common/SafeHtml';

describe('SafeHtml', () => {
  it('should render safe HTML content', () => {
    render(<SafeHtml html="<p>Hello World</p>" />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('should strip script tags', () => {
    const { container } = render(
      <SafeHtml html='<p>Safe</p><script>alert("xss")</script>' />,
    );
    expect(container.querySelector('script')).toBeNull();
    expect(screen.getByText('Safe')).toBeInTheDocument();
  });

  it('should strip event handlers', () => {
    const { container } = render(
      <SafeHtml html='<img src="x" onerror="alert(1)" />' />,
    );
    const img = container.querySelector('img');
    expect(img?.getAttribute('onerror')).toBeNull();
  });

  it('should strip iframe tags', () => {
    const { container } = render(
      <SafeHtml html='<iframe src="https://evil.com"></iframe><p>Content</p>' />,
    );
    expect(container.querySelector('iframe')).toBeNull();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should allow safe tags like headings and links', () => {
    const { container } = render(
      <SafeHtml html='<h1>Title</h1><a href="https://example.com">Link</a>' />,
    );
    expect(container.querySelector('h1')).not.toBeNull();
    expect(container.querySelector('a')).not.toBeNull();
    expect(container.querySelector('a')?.getAttribute('href')).toBe('https://example.com');
  });

  it('should strip javascript: URIs from links', () => {
    const { container } = render(
      <SafeHtml html='<a href="javascript:alert(1)">Click</a>' />,
    );
    const link = container.querySelector('a');
    // DOMPurify either removes the href or removes the entire tag
    if (link) {
      const href = link.getAttribute('href') ?? '';
      expect(href).not.toContain('javascript');
    }
    // Either way, no javascript: URI should be present in the output
    expect(container.innerHTML).not.toContain('javascript:');
  });

  it('should allow table elements', () => {
    const { container } = render(
      <SafeHtml html="<table><tr><th>Header</th></tr><tr><td>Cell</td></tr></table>" />,
    );
    expect(container.querySelector('table')).not.toBeNull();
    expect(container.querySelector('th')).not.toBeNull();
    expect(container.querySelector('td')).not.toBeNull();
  });

  it('should strip form elements', () => {
    const { container } = render(
      <SafeHtml html='<form action="/steal"><input type="text" /><button>Submit</button></form><p>After</p>' />,
    );
    expect(container.querySelector('form')).toBeNull();
    expect(container.querySelector('button')).toBeNull();
  });
});

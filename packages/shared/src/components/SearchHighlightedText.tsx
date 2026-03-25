import React from 'react';

type SearchHighlightedTextProps = {
  text: string;
  tokens: string[];
  className?: string;
  highlightClassName?: string;
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function SearchHighlightedText({
  text,
  tokens,
  className,
  highlightClassName = 'bg-amber-300/20 text-amber-100',
}: SearchHighlightedTextProps) {
  const filteredTokens = tokens.filter(Boolean);

  if (!text || filteredTokens.length === 0) {
    return <span className={className}>{text}</span>;
  }

  const pattern = new RegExp(`(${filteredTokens.map(escapeRegExp).join('|')})`, 'gi');
  const parts = text.split(pattern);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        const isMatch = filteredTokens.some((token) => token.toLowerCase() === part.toLowerCase());

        if (!isMatch) {
          return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
        }

        return (
          <mark key={`${part}-${index}`} className={`rounded px-0.5 ${highlightClassName}`}>
            {part}
          </mark>
        );
      })}
    </span>
  );
}

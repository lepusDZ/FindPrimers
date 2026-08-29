import type { ReactNode } from 'react';

interface Props {
  content: string;
  children: ReactNode;
}

export default function Tooltip({ content, children }: Props) {
  return (
    <span className="tooltip">
      {children}
      <span className="tooltip-content" role="tooltip">{content}</span>
    </span>
  );
}

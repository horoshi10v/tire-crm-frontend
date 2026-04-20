import { AsyncStateBlock } from './AsyncStateBlock';

type EmptyStateProps = {
  message: string;
  className?: string;
};

export function EmptyState({ message, className = '' }: EmptyStateProps) {
  return <AsyncStateBlock className={className}>{message}</AsyncStateBlock>;
}

import { AsyncStateBlock } from './AsyncStateBlock';

type LoadingBlockProps = {
  message?: string;
  className?: string;
};

export function LoadingBlock({
  message = 'Завантаження...',
  className = '',
}: LoadingBlockProps) {
  return <AsyncStateBlock className={className}>{message}</AsyncStateBlock>;
}

import { AsyncStateBlock } from './AsyncStateBlock';

type ErrorStateProps = {
  message: string;
  className?: string;
};

export function ErrorState({ message, className = '' }: ErrorStateProps) {
  return (
    <AsyncStateBlock tone="error" className={className}>
      {message}
    </AsyncStateBlock>
  );
}

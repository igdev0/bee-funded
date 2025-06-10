import {useRef} from 'react';

export default function useDebouncedValidator(fn: (value: string) => Promise<any>, delay: number) {
  const timeout = useRef<NodeJS.Timeout>(null);

  return (value: string) =>
      new Promise(resolve => {
        if (timeout.current) clearTimeout(timeout.current);
        timeout.current = setTimeout(() => {
          fn(value).then(resolve);
        }, delay);
      });
}

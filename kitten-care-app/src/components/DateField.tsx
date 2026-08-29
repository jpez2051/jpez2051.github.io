import type { InputHTMLAttributes, MouseEvent } from 'react';

export function DateField(props: InputHTMLAttributes<HTMLInputElement>) {
  const open = (event: MouseEvent<HTMLInputElement>) => {
    const input = event.currentTarget as HTMLInputElement & { showPicker?: () => void };
    try { input.showPicker?.(); } catch { /* Native input remains usable. */ }
  };
  return <input {...props} type={props.type || 'date'} onClick={open} />;
}

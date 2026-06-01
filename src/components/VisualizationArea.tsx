import type { ReactNode } from 'react';

interface VisualizationAreaProps {
  children?: ReactNode;
  label?: string;
}

export function VisualizationArea({ children, label = '索引结构可视化区域' }: VisualizationAreaProps) {
  return (
    <section className="visualization-area" aria-label={label}>
      {children}
    </section>
  );
}

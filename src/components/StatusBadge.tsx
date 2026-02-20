import { CarStatus, STATUS_LABELS, STATUS_COLORS } from '../types/car';

interface Props {
  status: CarStatus;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'sm' }: Props) {
  return (
    <span
      className={`status-badge status-badge-${size}`}
      style={{ backgroundColor: STATUS_COLORS[status] }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

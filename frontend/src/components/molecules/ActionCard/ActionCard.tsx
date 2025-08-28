import { ReactNode } from "react";
import Icon, { IconType } from "../../atoms/Icons/Icons";
import "./actionCard.scss";

export type ActionCardProps = {
  children: ReactNode;
  icon?: IconType;
  title: string;
  description?: string;
};

export default function ActionCard({ children, icon, title, description }: ActionCardProps) {
  return (
    <div className="action-card">
      <div className="action-card__header">
        {icon && <Icon icon={icon} />}
        <h3 className="action-card__title">{title}</h3>
      </div>
      {description && <p className="action-card__description">{description}</p>}
      {children}
    </div>
  );
}

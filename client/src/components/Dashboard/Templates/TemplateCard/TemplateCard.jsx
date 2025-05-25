import "./TemplateCard.css";

const TemplateCard = ({ title, subtitle }) => {
  return (
    <div className="template-card">
      <div className="template-thumbnail" />
      <div className="template-caption">
        <div className="template-title">{title}</div>
        {subtitle && <div className="template-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
};

export default TemplateCard;

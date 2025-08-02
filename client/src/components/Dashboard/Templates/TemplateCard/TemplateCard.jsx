import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import "./TemplateCard.css";

const TemplateCard = ({ title, subtitle, image }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    const newDocId = uuidv4();
    navigate(`/dashboard/documents/${newDocId}`);
  };

  return (
    <div className="template-card" onClick={handleClick} style={{ cursor: "pointer" }}>
      <div className="template-thumbnail">
        <img src={image} alt="Template-Thumbnail" className="template-thumbnail-img" />
      </div>
      <div className="template-caption">
        <div className="template-title">{title}</div>
        {subtitle && <div className="template-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
};

export default TemplateCard;

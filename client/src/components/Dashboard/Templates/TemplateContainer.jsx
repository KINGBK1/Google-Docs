import TemplateCard from "./TemplateCard/TemplateCard";
import { PiCaretUpDownBold } from "react-icons/pi";
import "./Template.css";

const TemplateContainer = () => {
    return (
        <div className="template-wrapper">
            <div className="template-header">
                <label className="template-title">Start a new document</label>
                <button className="template-gallery-btn">
                    <span>Template gallery</span>
                    <PiCaretUpDownBold />
                </button>
            </div>

            <div className="template-list">
                <TemplateCard title="Blank Document" />
                <TemplateCard title="Resume" subtitle="Serif" />
                <TemplateCard title="Resume" subtitle="Coral" />
                <TemplateCard title="Letter" subtitle="Spearmint" />
                <TemplateCard title="Project" subtitle="Tropic" />
                <TemplateCard title="Brochure" subtitle="Geometric" />
                <TemplateCard title="Report" subtitle="Luxe" />
            </div>
        </div>
    );
};

export default TemplateContainer;

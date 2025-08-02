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
                <TemplateCard title="Blank Document" image={"assets/Screenshot from 2025-08-02 09-32-38.png"}/>
                <TemplateCard title="Resume" subtitle="Serif" image={"assets/Screenshot from 2025-08-02 09-27-29.png"} />
                <TemplateCard title="Resume" subtitle="Coral" image={"assets/Screenshot from 2025-08-02 09-24-29.png"} />
                <TemplateCard title="Letter" subtitle="Spearmint" image={"assets/Screenshot from 2025-08-02 09-29-23.png"}/>
                <TemplateCard title="Project" subtitle="Tropic" image={"assets/Screenshot from 2025-08-02 09-31-34.png"} />
                <TemplateCard title="Brochure" subtitle="Geometric" image={"assets/Screenshot from 2025-08-02 09-17-50.png"}/>
                <TemplateCard title="Report" subtitle="Luxe" image={"assets/Screenshot from 2025-08-02 09-30-38.png"}/>
            </div>
        </div>
    );
};

export default TemplateContainer;

import Navbar from "./Navbar/Navbar";
import TemplateContainer from "./Templates/TemplateContainer";
import RecentDocs from "./Recent-Docs/RecentDocs";

const Dashboard = () => {
    return(
        <div>
            <Navbar />
            <TemplateContainer />
            <RecentDocs/>
        </div>
    );
}

export default Dashboard;
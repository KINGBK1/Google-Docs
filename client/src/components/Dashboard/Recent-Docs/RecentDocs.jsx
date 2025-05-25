import RecentDocCard from "./RecentDocCard/RecentDocCard";
import "./RecentDocs.css";
import { FaTableList } from "react-icons/fa6";
import { TiSortAlphabetically } from "react-icons/ti";
import { FaFolderMinus } from "react-icons/fa";

const RecentDocs = () => {

    return (
        <div className="recent-doc-wrapper">
            <div className="recent-doc-header">
                <div className="heading">
                    <label htmlFor="">Recent document</label>
                </div>
                <div className="option-btns">
                    <div className="list">
                        <select name="owned-by" id="owned-by">
                            <option value="owned-by-me">Owned By Me</option>
                            <option value="owned-by-anyone">Owned By Anyone</option>
                            <option value="not-owned-by-me">Not Owned By Me</option>
                        </select>
                    </div>

                    <div className="btns">
                        <button>
                            <FaTableList />
                        </button>
                        <button>
                            <TiSortAlphabetically />
                        </button>
                        <button>
                            <FaFolderMinus />
                        </button>
                    </div>
                </div>
            </div>
            <div className="recent-doc-list">
                <RecentDocCard />
                <RecentDocCard />
            </div>
        </div>
    );
}

export default RecentDocs;
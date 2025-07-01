import './underConstruction.css';

const UnderConstruction = ({ onClose }) => {
  return (
    <div className="under-construction-wrapper">
      <div className="under-construction-modal">
        <h2>🚧 Under Construction</h2>
        <p>This feature is still in development and will be available soon.</p>
        <p>You can <strong>contribute to it on a separate Git branch</strong> and help improve it!</p>
        <p>Thanks for your patience 🙏</p>

        <div className="under-construction-buttons">
          <a
            href="https://github.com/KINGBK1/Google-Docs/tree/dev" 
            target="_blank"
            rel="noopener noreferrer"
            className="contribute-btn"
          >
            ⭐ Contribute on GitHub
          </a>
          {onClose && (
            <button className="close-btn" onClick={onClose}>Close</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnderConstruction;

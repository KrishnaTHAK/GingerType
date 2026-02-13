import '../MainBody.css';

function TestDuration() {
    return (
      <div className="settings-test-duration">
        <span>Test Duration :</span>
        <select className="test-duration-options-container">
          <option>30s</option>
          <option>40s</option>
          <option>60s</option>
          <option>1m</option>
          <option>2m</option>
          <option>3m</option>
          <option>5m</option>
        </select>
      </div>
    );
}

export default TestDuration;
import "../MainBody.css";

function TestDuration({ duration, setDuration }) {
  return (
    <div className="settings-test-duration">
      <span>Test Duration :</span>
      <select
        className="test-duration-options-container"
        value={duration}
        onChange={(e) => setDuration(Number(e.target.value))}
      >
        <option value={15}>15s</option>
        <option value={30}>30s</option>
        <option value={40}>45s</option>
        <option value={60}>60s</option>
        <option value={60}>1m</option>
        <option value={120}>2m</option>
        <option value={180}>3m</option>
        <option value={300}>5m</option>
      </select>
    </div>
  );
}

export default TestDuration;

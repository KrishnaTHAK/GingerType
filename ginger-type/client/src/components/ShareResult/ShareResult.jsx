import { useRef } from 'react'
import html2canvas from 'html2canvas'
import './ShareResult.css'

function ShareResult({ wpm, accuracy, duration, onClose }) {

    const cardRef = useRef(null)

    const handleCopyText = () => {
        const text = `🎯 I scored ${wpm} WPM with ${accuracy}% accuracy on a ${duration}s test on GingerType! Can you beat me?`
        navigator.clipboard.writeText(text)
        alert('Result copied to clipboard!')
    }

    const handleDownloadCard = async () => {
        const canvas = await html2canvas(cardRef.current, { scale: 2 })
        const link = document.createElement('a')
        link.download = 'gingertype-result.png'
        link.href = canvas.toDataURL()
        link.click()
    }

    return (
        <div className="share-overlay" onClick={onClose}>
            <div className="share-modal" onClick={e => e.stopPropagation()}>
                <div className="share-header">
                    <h2>Share Result</h2>
                    <button className="close-icon" onClick={onClose}>&times;</button>
                </div>

                {/* Result Card */}
                <div className="result-card" ref={cardRef}>
                    <div className="result-card-header">
                        <span className="result-card-logo">GingerType</span>
                        <span className="result-card-duration">{duration}s test</span>
                    </div>
                    <div className="result-card-stats">
                        <div className="result-card-stat">
                            <span className="result-card-value">{wpm}</span>
                            <span className="result-card-label">WPM</span>
                        </div>
                        <div className="result-card-divider" />
                        <div className="result-card-stat">
                            <span className="result-card-value">{accuracy}%</span>
                            <span className="result-card-label">Accuracy</span>
                        </div>
                    </div>
                    <div className="result-card-footer">gingertype.com</div>
                </div>

                {/* Action Buttons */}
                <div className="share-actions">
                    <button className="share-btn copy" onClick={handleCopyText}>
                        📋 Copy Text
                    </button>
                    <button className="share-btn download" onClick={handleDownloadCard}>
                        ⬇️ Download Card
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ShareResult
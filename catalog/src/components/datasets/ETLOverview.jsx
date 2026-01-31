import React from 'react'
import { useNavigate } from 'react-router-dom'
import './ETLOverview.css'
import catalogIcon from '../../imgs/catalog.png'
import { getPipelineName } from '../../utils/pipelineUtils'

const ETLOverview = ({ pipeline, dataset, pipelineAgreements = [] }) => {
  const navigate = useNavigate()
  
  // Extract ETL information from dataset or use defaults
  const etlInfo = dataset?.etlOverview || {}
  
  const etlPOC = etlInfo.poc || 'N/A'
  const etlOrg = etlInfo.org || 'N/A'
  const etlPlatform = etlInfo.platform || 'N/A'
  const etlAvgRuntime = etlInfo.avgRunTime || etlInfo.avgRuntime || 'N/A'
  const etlSchedule = etlInfo.schedule || 'N/A'
  const githubLink = etlInfo.githubLink || null
  
  // Get consumers and agreements for this specific pipeline
  const pipelineAgreementsList = pipelineAgreements.filter(
    agreement => agreement.pipeline === pipeline
  )

  const currentAgreement = pipelineAgreementsList.find(
    agreement => agreement.pipeline === pipeline
  )

  const pipelineName = pipeline ? getPipelineName(pipeline) : null
  
  const handleAgreementClick = (e) => {
    e.preventDefault()
    if (currentAgreement?.id) {
      navigate(`/agreements/${currentAgreement.id}`)
    } else {
      // If no ID, navigate to agreements page with search params
      const searchParams = new URLSearchParams()
      if (currentAgreement?.consumer) {
        searchParams.set('search', currentAgreement.consumer)
      }
      navigate(`/agreements${searchParams.toString() ? `?${searchParams.toString()}` : ''}`)
    }
  }
  
  return (
    <div className="detail-section etl-overview">
      <div className="etl-header">
        <h2 className="section-title">ETL Overview</h2>
        {githubLink && (
          <div className="etl-github-wrapper">
            <span className="etl-github-label">Dataset Repo:</span>
            <a
              href={githubLink}
              target="_blank"
              rel="noopener noreferrer"
              className="etl-github-button"
              aria-label="Dataset Repo"
              title="Dataset Repo"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M12 2C6.48 2 2 6.58 2 12.26c0 4.51 2.87 8.33 6.84 9.68.5.09.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.9 1.57 2.36 1.12 2.94.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.09 0-1.13.39-2.06 1.03-2.79-.1-.26-.45-1.3.1-2.7 0 0 .84-.27 2.75 1.06.8-.23 1.65-.35 2.5-.35.85 0 1.7.12 2.5.35 1.9-1.33 2.74-1.06 2.74-1.06.55 1.4.2 2.44.1 2.7.64.73 1.03 1.66 1.03 2.79 0 3.96-2.34 4.82-4.57 5.08.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.59.69.49A10.03 10.03 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z"
                  fill="currentColor"
                />
              </svg>
            </a>
          </div>
        )}
      </div>
      <div className="etl-overview-content">
        <div className="etl-info-grid">
          <div className="etl-info-item">
            <label className="etl-label">Periodicity</label>
            <div className="etl-value">{dataset?.periodicity || 'N/A'}</div>
          </div>
          
          <div className="etl-info-item">
            <label className="etl-label">Last Processed</label>
            <div className="etl-value">{dataset?.lastUpdated || 'N/A'}</div>
          </div>
          
          <div className="etl-info-item">
            <label className="etl-label">ETL Complexity</label>
            <div className="etl-value">{dataset?.complexity || 'N/A'}</div>
          </div>

          <div className="etl-info-item">
            <label className="etl-label">Avg Run Time</label>
            <div className="etl-value">{etlAvgRuntime}</div>
          </div>
          
          <div className="etl-info-item">
            <label className="etl-label">Schedule</label>
            <div className="etl-value">{etlSchedule}</div>
          </div>
          
          <div className="etl-info-item">
            <label className="etl-label">ETL POC</label>
            <div className="etl-value">{etlPOC}</div>
          </div>
          
          <div className="etl-info-item">
            <label className="etl-label">ETL ORG</label>
            <div className="etl-value">{etlOrg}</div>
          </div>
          
          <div className="etl-info-item">
            <label className="etl-label">ETL Platform</label>
            <div className="etl-value">{etlPlatform}</div>
          </div>
        </div>
        
        <div className="etl-data-products">
          {currentAgreement && (
            <div className="etl-agreements-table-wrapper">
              <h3 className="etl-subsection-title">Data Products &amp; Consumers</h3>
              <div className="agreement-table">
                <div className="agreement-row agreement-header">
                  <div>Pipeline</div>
                  <div>Status</div>
                  <div>Version</div>
                  <div>Consumer</div>
                  <div>Product</div>
                  <div>S3 Location</div>
                  <div>Agreement</div>
                </div>
                <div className="agreement-row active">
                  <div>{getPipelineName(currentAgreement.pipeline)}</div>
                  <div>
                    <span className="agreement-badge">{currentAgreement.status}</span>
                  </div>
                  <div>{currentAgreement.version}</div>
                  <div>{currentAgreement.consumer}</div>
                  <div>{currentAgreement.product}</div>
                  <div>{currentAgreement.s3Location}</div>
                  <div>
                    <a
                      className="status-catalog-link"
                      href={currentAgreement.id ? `/agreements/${currentAgreement.id}` : '/agreements'}
                      onClick={handleAgreementClick}
                      aria-label={`View agreement for ${pipelineName || getPipelineName(currentAgreement.pipeline)}`}
                    >
                      <img src={catalogIcon} alt="" className="catalog-icon-image" />
                      <span className="status-catalog-label">DH</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {!currentAgreement && (
            <div className="etl-empty">No data products or agreements listed</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ETLOverview


import React from 'react'
import { useNavigate } from 'react-router-dom'
import catalogIcon from '../../imgs/catalog.png'
import { getPipelineName } from '../../utils/pipelineUtils'
import './DataProductsAgreements.css'

const DataProductsAgreements = ({ pipeline, agreements = [] }) => {
  const navigate = useNavigate()
  const currentAgreement = agreements.find(agreement => agreement.pipeline === pipeline)
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
  
  if (!pipeline || agreements.length === 0) {
    return (
      <div className="detail-section">
        <h3 className="section-title">Data Products & Consumers</h3>
        <p className="detail-description-text">No pipelines available for agreements.</p>
      </div>
    )
  }

  if (!currentAgreement) {
    return (
      <div className="detail-section">
        <h3 className="section-title">Data Products & Consumers</h3>
        <p className="detail-description-text">No agreement data available for {pipelineName || pipeline}.</p>
      </div>
    )
  }

  return (
    <div className="detail-section">
      <h3 className="section-title">Data Products & Consumers</h3>
      <div className="agreement-table">
        <div className="agreement-row agreement-header">
          <div>Pipeline</div>
          <div>Status</div>
          <div>Version</div>
          <div>Producer</div>
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
          <div>{currentAgreement.producer}</div>
          <div>{currentAgreement.consumer}</div>
          <div>{currentAgreement.product}</div>
          <div>{currentAgreement.s3Location}</div>
          <div>
            <a
              className="status-catalog-link"
              href={currentAgreement.id ? `/agreements/${currentAgreement.id}` : '/agreements'}
              onClick={handleAgreementClick}
              aria-label={`View agreement for ${getPipelineName(currentAgreement.pipeline)}`}
            >
              <img src={catalogIcon} alt="" className="catalog-icon-image" />
              <span className="status-catalog-label">DH</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DataProductsAgreements

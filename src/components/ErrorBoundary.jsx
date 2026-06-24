import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, info: null }
  }

  // 文件:更新 state,令下次 render 顯示 fallback UI
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  // 文件:可選,攞埋 componentStack 出嚟(production 會被 minify)
  componentDidCatch(error, info) {
    console.error('ErrorBoundary 接到錯誤:', error, info.componentStack)
    this.setState({ info })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, fontFamily: 'monospace', color: '#b91c1c' }}>
          <h2 style={{ fontWeight: 700, marginBottom: 8 }}>頁面發生錯誤</h2>
          <p style={{ whiteSpace: 'pre-wrap', marginBottom: 12 }}>
            {String(this.state.error?.message || this.state.error)}
          </p>
          {this.state.info?.componentStack && (
            <pre style={{ background: '#f1f5f9', padding: 12, borderRadius: 8, overflow: 'auto', fontSize: 12 }}>
              {this.state.info.componentStack}
            </pre>
          )}
          <button onClick={() => location.reload()}
            style={{ marginTop: 12, padding: '8px 16px', background: '#000', color: '#fff', borderRadius: 8, border: 0, cursor: 'pointer' }}>
            重新載入
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
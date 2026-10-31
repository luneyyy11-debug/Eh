/// <reference types="vite/client" />
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AppProvider } from './context/AppContext'
import { I18nProvider } from './i18n/I18nProvider'
import { ConfirmProvider } from './components/ui'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <I18nProvider>
          <ConfirmProvider>
            <App />
          </ConfirmProvider>
        </I18nProvider>
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>
)

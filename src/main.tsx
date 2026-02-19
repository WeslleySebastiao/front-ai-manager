import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import AppLayout from './app/layout/AppLayout'
import Dashboard from './app/routes/Dashboard'
import Agentes from './app/routes/Agentes/Agentes'
import CriarNovoAgente from './app/routes/Agentes/CriarNovoAgente'
import EditarAgente from './app/routes/Agentes/EditAgent'
import AgentChat from './app/routes/Agentes/AgentChat'
import PRReviews from './app/routes/PRReviews/PRReviews'
import './index.css'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true,                    element: <Dashboard />       },
      { path: 'agentes',                element: <Agentes />         },
      { path: 'agentes/novo',           element: <CriarNovoAgente /> },
      { path: 'agentes/:id/editar',     element: <EditarAgente />    },
      { path: 'agentes/:id',            element: <AgentChat />       },
      { path: 'pr-reviews',             element: <PRReviews />       },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)

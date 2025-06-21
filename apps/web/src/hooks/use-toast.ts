import * as React from "react"

export interface ToastProps {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

interface ToastContextProps {
  toast: (props: ToastProps) => void
}

const ToastContext = React.createContext<ToastContextProps | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toast = (props: ToastProps) => {
    // Simple implementation - in production you'd want a proper toast system
    if (props.variant === 'destructive') {
      console.error(`${props.title}: ${props.description}`)
      alert(`Error: ${props.title}\n${props.description}`)
    } else {
      console.log(`${props.title}: ${props.description}`)
      alert(`${props.title}\n${props.description}`)
    }
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

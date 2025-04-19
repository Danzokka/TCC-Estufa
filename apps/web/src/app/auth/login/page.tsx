import { Card } from '@/components/ui/card'
import React from 'react'
import LoginForm from './LoginForm'

const page = () => {
  return (
     <Card className='w-full max-w-md p-6 bg-transparent border-secondary'>
      <LoginForm />
     </Card>
  )
}

export default page
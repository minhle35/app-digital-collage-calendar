import { use } from 'react'

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  use(params)
  return <div>Reset Password</div>
}

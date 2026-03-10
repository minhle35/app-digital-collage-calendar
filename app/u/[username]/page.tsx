import { use } from 'react'

export default function CreatorProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  return <div>Creator: {username}</div>
}

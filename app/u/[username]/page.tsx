export default function CreatorProfilePage({ params }: { params: { username: string } }) {
  return <div>Creator: {params.username}</div>
}

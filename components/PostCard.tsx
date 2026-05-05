'use client'

import { useState } from 'react'
import type { PostRow } from '@/types/database'

interface PostCardProps {
  post: PostRow
  isToday: boolean
  onUploaded: (postId: string) => void
  onDeleted: (postId: string) => void
}

export default function PostCard({ post, isToday, onUploaded, onDeleted }: PostCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const firstLine = post.content.split('\n')[0]

  const handleCopy = async () => {
    await navigator.clipboard.writeText(post.content)
    setCopyFeedback(true)
    setTimeout(() => setCopyFeedback(false), 1500)
  }

  const handleUploaded = async () => {
    setUploadLoading(true)
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: 'PATCH' })
      if (res.ok) onUploaded(post.id)
    } finally {
      setUploadLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('게시글을 삭제할까요? 삭제 후 복구할 수 없습니다.')) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' })
      if (res.ok) onDeleted(post.id)
    } finally {
      setDeleteLoading(false)
    }
  }

  const StatusBadge = () => (
    <span className={`flex items-center gap-1 text-xs ${post.is_uploaded ? 'text-green-500' : 'text-orange-500'}`}>
      <span className={`w-1.5 h-1.5 rounded-full inline-block ${post.is_uploaded ? 'bg-green-500' : 'bg-orange-500'}`} />
      {post.is_uploaded ? '업로드완료' : '미업로드'}
    </span>
  )

  if (isToday) {
    return (
      <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 space-y-3">
        <StatusBadge />
        <p className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">{post.content}</p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleCopy}
            className="rounded-lg border border-gray-200 text-gray-700 py-1.5 px-3 text-sm hover:bg-gray-50 transition-colors"
          >
            {copyFeedback ? '복사됨!' : '복사'}
          </button>
          {!post.is_uploaded && (
            <button
              onClick={handleUploaded}
              disabled={uploadLoading}
              className="rounded-lg bg-green-500 text-white py-1.5 px-3 text-sm hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {uploadLoading ? '처리 중...' : '업로드완료'}
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleteLoading}
            className="rounded-lg text-red-500 hover:bg-red-50 py-1.5 px-3 text-sm transition-colors disabled:opacity-50"
          >
            {deleteLoading ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="rounded-lg bg-gray-50 border border-gray-200 p-4 cursor-pointer"
      onClick={() => setExpanded((prev) => !prev)}
    >
      <div className="flex items-center justify-between mb-1">
        <StatusBadge />
        <span className="text-xs text-gray-400">
          {new Date(new Date(post.created_at).getTime() + 9 * 60 * 60 * 1000).toLocaleDateString('ko-KR')}
        </span>
      </div>
      {expanded ? (
        <div onClick={(e) => e.stopPropagation()}>
          <p className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed mb-3">{post.content}</p>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="rounded-lg border border-gray-200 text-gray-700 py-1.5 px-3 text-sm hover:bg-gray-50 transition-colors"
            >
              {copyFeedback ? '복사됨!' : '복사'}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteLoading}
              className="rounded-lg text-red-500 hover:bg-red-50 py-1.5 px-3 text-sm transition-colors disabled:opacity-50"
            >
              {deleteLoading ? '삭제 중...' : '삭제'}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-700 truncate">{firstLine}</p>
      )}
    </div>
  )
}

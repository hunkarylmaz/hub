import React, { useEffect, useState } from 'react'
import {
  X,
  AlertCircle,
  MessageSquare,
  Eye,
  RefreshCw,
  Filter,
  CheckCheck,
  Reply,
} from 'lucide-react'
import api from '../lib/api'

interface ContactMessage {
  id: number
  name: string
  email: string
  phone?: string
  subject?: string
  message: string
  status: 'unread' | 'read' | 'replied'
  created_at: string
}

const statusConfig: Record<string, { label: string; color: string }> = {
  unread: { label: 'Okunmadı', color: 'bg-blue-100 text-blue-700' },
  read: { label: 'Okundu', color: 'bg-gray-100 text-gray-600' },
  replied: { label: 'Cevaplandı', color: 'bg-green-100 text-green-700' },
}

const statusOptions = [
  { value: '', label: 'Tümü' },
  { value: 'unread', label: 'Okunmadı' },
  { value: 'read', label: 'Okundu' },
  { value: 'replied', label: 'Cevaplandı' },
]

export default function ContactsAdmin() {
  const [contacts, setContacts] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [viewContact, setViewContact] = useState<ContactMessage | null>(null)
  const [updating, setUpdating] = useState<number | null>(null)

  const fetchContacts = async () => {
    setLoading(true)
    setError('')
    try {
      const params: Record<string, string> = {}
      if (filterStatus) params.status = filterStatus
      const res = await api.get('/contacts', { params })
      setContacts(res.data.contacts || res.data || [])
    } catch {
      setError('Mesajlar yüklenirken hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchContacts() }, [filterStatus])

  const handleView = async (contact: ContactMessage) => {
    setViewContact(contact)
    if (contact.status === 'unread') {
      try {
        await api.put(`/contacts/${contact.id}`, { status: 'read' })
        setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, status: 'read' } : c))
        setViewContact(prev => prev ? { ...prev, status: 'read' } : prev)
      } catch {
        // ignore
      }
    }
  }

  const handleStatusUpdate = async (contactId: number, newStatus: string) => {
    setUpdating(contactId)
    try {
      await api.put(`/contacts/${contactId}`, { status: newStatus })
      setContacts(prev => prev.map(c => c.id === contactId ? { ...c, status: newStatus as ContactMessage['status'] } : c))
      if (viewContact?.id === contactId) {
        setViewContact(prev => prev ? { ...prev, status: newStatus as ContactMessage['status'] } : prev)
      }
    } catch {
      setError('Durum güncellenemedi.')
    } finally {
      setUpdating(null)
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const unreadCount = contacts.filter(c => c.status === 'unread').length

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800">Mesajlar</h1>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                {unreadCount} yeni
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm mt-0.5">Müşteri iletişim mesajlarını yönetin</p>
        </div>
        <button
          onClick={fetchContacts}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-3.5 mb-4 flex items-center gap-4">
        <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <div className="flex flex-wrap gap-2">
          {statusOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilterStatus(opt.value)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
                filterStatus === opt.value
                  ? 'bg-[#1952d9] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.label}
              {opt.value === 'unread' && unreadCount > 0 && ` (${unreadCount})`}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">
            <div className="w-8 h-8 border-2 border-[#1952d9] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Yükleniyor...
          </div>
        ) : contacts.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Bu kriterlere uygun mesaj bulunamadı.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Tarih</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Gönderen</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Telefon</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Konu</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Durum</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {contacts.map(contact => (
                  <tr
                    key={contact.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      contact.status === 'unread' ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(contact.created_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className={`text-sm ${contact.status === 'unread' ? 'font-semibold text-gray-900' : 'font-medium text-gray-800'}`}>
                        {contact.name}
                      </p>
                      <p className="text-xs text-gray-400">{contact.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{contact.phone || '-'}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-700 max-w-xs truncate">
                      {contact.subject || 'Konu belirtilmemiş'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        statusConfig[contact.status]?.color || 'bg-gray-100 text-gray-600'
                      }`}>
                        {statusConfig[contact.status]?.label || contact.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        {contact.status !== 'read' && contact.status !== 'replied' && (
                          <button
                            onClick={() => handleStatusUpdate(contact.id, 'read')}
                            disabled={updating === contact.id}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Okundu İşaretle"
                          >
                            <CheckCheck className="w-4 h-4" />
                          </button>
                        )}
                        {contact.status !== 'replied' && (
                          <button
                            onClick={() => handleStatusUpdate(contact.id, 'replied')}
                            disabled={updating === contact.id}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="Cevaplandı İşaretle"
                          >
                            <Reply className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleView(contact)}
                          className="p-1.5 text-gray-400 hover:text-[#1952d9] hover:bg-blue-50 rounded-lg transition"
                          title="Mesajı Gör"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Message Modal */}
      {viewContact && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Mesaj Detayı</h2>
              <button onClick={() => setViewContact(null)} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Gönderen</p>
                  <p className="text-sm font-semibold text-gray-800">{viewContact.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Durum</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConfig[viewContact.status]?.color || ''}`}>
                    {statusConfig[viewContact.status]?.label}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">E-posta</p>
                  <a href={`mailto:${viewContact.email}`} className="text-sm text-[#1952d9] hover:underline">
                    {viewContact.email}
                  </a>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Telefon</p>
                  <p className="text-sm text-gray-700">{viewContact.phone || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Konu</p>
                  <p className="text-sm text-gray-700">{viewContact.subject || 'Konu belirtilmemiş'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Mesaj</p>
                  <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4 leading-relaxed">
                    {viewContact.message}
                  </div>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Tarih</p>
                  <p className="text-sm text-gray-600">{formatDate(viewContact.created_at)}</p>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Durumu Güncelle</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatusUpdate(viewContact.id, 'read')}
                    disabled={viewContact.status === 'read' || updating === viewContact.id}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Okundu
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(viewContact.id, 'replied')}
                    disabled={viewContact.status === 'replied' || updating === viewContact.id}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    Cevaplandı
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
              <button onClick={() => setViewContact(null)} className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition">
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

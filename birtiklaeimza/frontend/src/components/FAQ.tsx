import { useState, useEffect } from 'react'
import { ChevronDown, HelpCircle, Loader2 } from 'lucide-react'
import api from '../lib/api'

interface FAQItem {
  id: number
  question: string
  answer: string
  category?: string
}

const fallbackFAQs: FAQItem[] = [
  {
    id: 1,
    question: 'e-İmza nedir ve ne işe yarar?',
    answer: 'Elektronik imza (e-İmza), dijital ortamda belgeleri imzalamak için kullanılan yasal bir araçtır. Kâğıt imzanın dijital karşılığıdır. e-İmza ile e-Devlet işlemleri, sözleşmeler, bankacılık işlemleri ve daha birçok resmi belgeyi imzalayabilirsiniz.',
  },
  {
    id: 2,
    question: 'e-İmza başvurusu için hangi belgeler gereklidir?',
    answer: 'Bireysel başvuru için: Nüfus cüzdanı veya pasaport fotokopisi, güncel fatura veya ikametgah belgesi. Kurumsal başvuru için ek olarak: Vergi levhası, imza sirküleri veya ticaret sicil gazetesi gereklidir.',
  },
  {
    id: 3,
    question: 'e-İmzam ne kadar sürede gelir?',
    answer: 'Başvurunuz onaylandıktan sonra e-İmzanız 24 saat içinde kargo ile adresinize gönderilir. Acil durumlarda aynı gün teslimat seçeneğimiz de mevcuttur. İstanbul içi teslimatlar genellikle aynı gün gerçekleşir.',
  },
  {
    id: 4,
    question: 'e-İmza kurulumu nasıl yapılır?',
    answer: 'USB Token\'ı bilgisayarınıza taktıktan sonra sürücüyü kurun. Ardından size gelen aktivasyon kodu ile e-imzanızı aktive edin. Kurulum konusunda 7/24 teknik destek ekibimiz size yardımcı olmaktadır. Uzaktan destek seçeneği de sunulmaktadır.',
  },
  {
    id: 5,
    question: 'e-İmzayı hangi işlemlerde kullanabilirim?',
    answer: 'e-İmzayı; e-Devlet ve kamu hizmetleri, SGK işlemleri, belediye işlemleri, e-fatura ve e-defter, bankacılık işlemleri, mahkeme ve hukuki işlemler, ihale süreçleri ve sözleşmeler gibi pek çok alanda kullanabilirsiniz.',
  },
  {
    id: 6,
    question: 'e-İmza süresi dolduğunda ne yapmalıyım?',
    answer: 'e-İmza süreniz dolmadan 3 ay önce sistem otomatik olarak sizi bilgilendirir. Yenileme işlemi için bizimle iletişime geçmeniz yeterlidir. Mevcut müşterilerimize yenileme sürecinde özel indirim uygulanmaktadır.',
  },
  {
    id: 7,
    question: 'Mobil e-İmza ile USB Token\'lı e-İmza arasındaki fark nedir?',
    answer: 'USB Token\'lı e-İmza; bilgisayara takılan fiziksel bir cihazla çalışır. Mobil e-İmza ise SIM kart tabanlıdır ve herhangi bir cihaz gerektirmez; telefonunuz üzerinden imzalama yapabilirsiniz. Her ikisi de yasal olarak geçerlidir.',
  },
  {
    id: 8,
    question: 'Ödeme seçenekleriniz nelerdir?',
    answer: 'Kredi kartı (taksit imkânıyla), banka kartı, havale/EFT ve fatura ile ödeme seçeneklerimiz mevcuttur. Kurumsal müşterilere özel fatura ile ödeme imkânı sunulmaktadır.',
  },
]

export default function FAQ() {
  const [faqs, setFaqs] = useState<FAQItem[]>([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<number | null>(null)

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        const response = await api.get('/faq')
        setFaqs(response.data)
      } catch {
        setFaqs(fallbackFAQs)
      } finally {
        setLoading(false)
      }
    }
    fetchFAQs()
  }, [])

  return (
    <section className="py-24 bg-white" id="sss">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-sm font-semibold text-[#1952d9] mb-4">
            <HelpCircle className="w-4 h-4" />
            SSS
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
            Sık Sorulan <span className="text-gradient">Sorular</span>
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Merak ettiğiniz her şeyin cevabı burada. Başka sorularınız için bize ulaşın.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#1952d9] animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {faqs.map((faq) => (
              <FAQAccordion
                key={faq.id}
                faq={faq}
                isOpen={openId === faq.id}
                onToggle={() => setOpenId(openId === faq.id ? null : faq.id)}
              />
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-12 text-center p-8 bg-[#f8faff] rounded-2xl border border-blue-100">
          <p className="text-slate-600 mb-4">
            Cevap bulamadınız mı? Bizimle iletişime geçin.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="tel:+905503028540"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1952d9] text-white font-semibold rounded-xl hover:bg-[#0a2569] transition-colors"
            >
              Bizi Arayın
            </a>
            <a
              href="/iletisim"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-[#1952d9] text-[#1952d9] font-semibold rounded-xl hover:bg-[#1952d9] hover:text-white transition-colors"
            >
              Mesaj Gönderin
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

function FAQAccordion({ faq, isOpen, onToggle }: { faq: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div
      className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
        isOpen ? 'border-[#1952d9] shadow-md shadow-blue-500/10' : 'border-slate-200 hover:border-blue-200'
      }`}
    >
      <button
        className="w-full flex items-center justify-between px-6 py-5 text-left bg-white hover:bg-[#f8faff] transition-colors"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className={`font-semibold text-sm md:text-base pr-4 ${isOpen ? 'text-[#1952d9]' : 'text-slate-800'}`}>
          {faq.question}
        </span>
        <ChevronDown
          className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#1952d9]' : 'text-slate-400'
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-6 pb-5 bg-white">
          <div className="border-t border-slate-100 pt-4">
            <p className="text-slate-600 text-sm md:text-base leading-relaxed">{faq.answer}</p>
          </div>
        </div>
      )}
    </div>
  )
}

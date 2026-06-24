import { LegalPage } from "@/components/marketing/LegalPage";

export default function GizlilikPage() {
  return (
    <LegalPage title="Gizlilik Politikası">
      <p>
        Rezervasyo olarak kullanıcılarımızın ve müşterilerimizin kişisel verilerinin gizliliğini önemsiyoruz. Bu sayfa,
        platformumuz üzerinden toplanan verilerin nasıl işlendiğine dair genel bilgi amaçlı bir taslak metindir ve
        ürünün MVP aşamasında yer tutucu olarak sunulmaktadır.
      </p>
      <p>
        Toplanan veriler; işletme ve kullanıcı hesap bilgileri, randevu kayıtları ve müşteri iletişim bilgilerinden
        oluşur. Veriler, yalnızca ilgili işletmenin randevu ve müşteri yönetimi amacıyla işlenir ve işletmeler arası
        paylaşılmaz.
      </p>
      <p>
        6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamındaki haklarınızı kullanmak için işletmenizin
        size ilettiği iletişim kanallarını kullanabilirsiniz.
      </p>
    </LegalPage>
  );
}

import { Footer, Header } from "@/components/SiteChrome";

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="flex-1 mx-auto max-w-2xl px-4 py-10 w-full prose prose-neutral">
        <h1 className="text-3xl font-bold mb-6">Privacy & consent</h1>
        <div className="space-y-4 text-ink-soft">
          <p><strong className="text-ink">What we collect.</strong> Your child&apos;s first name or nickname, age, a short structured description of their appearance (skin tone, hair), their interests, the struggle you selected, a personal detail you chose to share, and your contact details (name, email, optional phone). If you order a printed book, we also collect a delivery name, address and phone number.</p>
          <p><strong className="text-ink">What we never collect.</strong> We never ask for, accept or store photos of your child. Illustrations are original artwork generated from the structured description only.</p>
          <p><strong className="text-ink">How we use it.</strong> To generate one personalized story and its illustrations, to email you the result, and — only if you order one — to deliver a printed book. The story text and illustration prompts are processed by Google&apos;s Gemini API to generate content; Google does not use paid-tier API content to train its models.</p>
          <p><strong className="text-ink">Who can see the story.</strong> Each story has a private, unguessable link. Anyone you share the link with can view it. We don&apos;t publish stories.</p>
          <p><strong className="text-ink">Retention and deletion.</strong> Stories are kept so you can return to them. Email <a className="text-coral" href="mailto:hello@estoria.kids">hello@estoria.kids</a> from the address you used and we&apos;ll delete a story and all its data within 7 days.</p>
          <p><strong className="text-ink">Consent.</strong> By ticking the consent box you confirm you are the parent or legal guardian of the child and agree to this use of the information.</p>
        </div>
        <h2 className="text-2xl font-bold mt-10 mb-4" dir="rtl">الخصوصية والموافقة</h2>
        <div className="space-y-3 text-ink-soft" dir="rtl">
          <p>بنجمع: اسم طفلك أو اسم الدلع، سنه، وصف بسيط لشكله (لون البشرة والشعر)، اهتماماته، المشكلة اللي اخترتها، تفصيلة شخصية اخترت تشاركها، وبيانات التواصل بتاعتك. لو طلبت كتاب مطبوع بنجمع كمان اسم وعنوان ورقم موبايل للتوصيل.</p>
          <p>عمرنا ما بنطلب أو نخزن صور لطفلك. الرسومات أصلية ومعمولة من الوصف بس.</p>
          <p>بنستخدم البيانات عشان نعمل قصة واحدة مخصصة ونبعتهالك على الإيميل، ولو طلبت كتاب مطبوع، عشان نوصّله. عايز تمسح القصة؟ ابعتلنا على hello@estoria.kids من نفس الإيميل.</p>
        </div>
      </main>
      <Footer />
    </>
  );
}

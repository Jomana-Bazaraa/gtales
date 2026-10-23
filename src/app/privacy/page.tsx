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
          <p><strong className="text-ink">Retention and deletion.</strong> Stories are kept so you can return to them. Email <a className="text-coral" href="mailto:hello@gtales.kids">hello@gtales.kids</a> from the address you used and we&apos;ll delete a story and all its data within 7 days.</p>
          <p><strong className="text-ink">Consent.</strong> By ticking the consent box you confirm you are the parent or legal guardian of the child and agree to this use of the information.</p>
        </div>
        <h2 id="reviews" className="text-2xl font-bold mt-10 mb-4 scroll-mt-16">Reviews</h2>
        <div className="space-y-4 text-ink-soft">
          <p><strong className="text-ink">What we show.</strong> Your star rating and words, your first name, your city if you give it, and your child&apos;s age, plus any photos or video you add. Never your child&apos;s full name, never your email or phone number. Nothing is shown until our team has checked it.</p>
          <p><strong className="text-ink">Consent.</strong> Before sending, you confirm that you are the parent or guardian of any child shown, and that GTales may show the review, photos and video on its website and social media. You also confirm you understand you can ask us to remove it at any time.</p>
          <p><strong className="text-ink">How we keep photos and videos.</strong> In private storage. Our website shows approved ones through links that expire after a short time. Photos are resized on your phone before they are sent, which also removes hidden data such as the location where they were taken.</p>
          <p><strong className="text-ink">Removing a review.</strong> Email <a className="text-coral" href="mailto:hello@gtales.kids">hello@gtales.kids</a> or message us on WhatsApp and we delete the review, its photos and its video within 7 days, from our website and from our social media posts.</p>
        </div>
        <h2 className="text-2xl font-bold mt-10 mb-4" dir="rtl">الخصوصية والموافقة</h2>
        <div className="space-y-3 text-ink-soft" dir="rtl">
          <p>بنجمع: اسم طفلك أو اسم الدلع، سنه، وصف بسيط لشكله (لون البشرة والشعر)، اهتماماته، المشكلة اللي اخترتها، تفصيلة شخصية اخترت تشاركها، وبيانات التواصل بتاعتك. لو طلبت كتاب مطبوع بنجمع كمان اسم وعنوان ورقم موبايل للتوصيل.</p>
          <p>عمرنا ما بنطلب أو نخزن صور لطفلك. الرسومات أصلية ومعمولة من الوصف بس.</p>
          <p>بنستخدم البيانات عشان نعمل قصة واحدة مخصصة ونبعتهالك على الإيميل، ولو طلبت كتاب مطبوع، عشان نوصّله. عايز تمسح القصة؟ ابعتلنا على hello@gtales.kids من نفس الإيميل.</p>
          <p>لو بعتلنا رأيك: بنعرض التقييم وكلامك واسمك الأول ومدينتك وسن طفلك بس، ومعاهم الصور أو الفيديو اللي بعتهم. عمرنا ما بنعرض اسم طفلك كامل، ومفيش حاجة بتظهر قبل ما فريقنا يراجعها. عايز نشيل رأيك؟ ابعتلنا على hello@gtales.kids أو واتساب وهنمسحه هو والصور والفيديو خلال ٧ أيام.</p>
        </div>
      </main>
      <Footer />
    </>
  );
}

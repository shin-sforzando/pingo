/**
 * Why: Separates testable content from async Server Component
 * Why: Next.js pages can only have default export
 * Why: Enables direct testing without async complexity
 */
export function TermsPageContent() {
  return (
    <div className="container mx-auto px-4 py-8">
      <article className="prose prose-sm mx-auto max-w-3xl dark:prose-invert md:prose-base">
        {/* Japanese Version */}
        <section lang="ja" data-testid="japanese-terms-section">
          <header className="mb-8">
            <h1 className="mb-2 font-bold text-3xl md:text-4xl">
              Pingo 利用規約
            </h1>
          </header>

          {/* Table of Contents - Japanese */}
          <nav aria-label="目次" className="not-prose mb-12">
            <details className="rounded-lg border bg-muted/30 p-4">
              <summary className="cursor-pointer font-semibold text-lg">
                目次
              </summary>
              <ol className="ml-6 mt-4 list-decimal space-y-2">
                <li>
                  <a
                    href="#article-1-ja"
                    className="text-primary hover:underline"
                  >
                    目的および適用
                  </a>
                </li>
                <li>
                  <a
                    href="#article-2-ja"
                    className="text-primary hover:underline"
                  >
                    定義
                  </a>
                </li>
                <li>
                  <a
                    href="#article-3-ja"
                    className="text-primary hover:underline"
                  >
                    登録およびアカウント管理
                  </a>
                </li>
                <li>
                  <a
                    href="#article-4-ja"
                    className="text-primary hover:underline"
                  >
                    禁止事項
                  </a>
                </li>
                <li>
                  <a
                    href="#article-5-ja"
                    className="text-primary hover:underline"
                  >
                    投稿データの取扱い
                  </a>
                </li>
                <li>
                  <a
                    href="#article-6-ja"
                    className="text-primary hover:underline"
                  >
                    個人情報およびプライバシー
                  </a>
                </li>
                <li>
                  <a
                    href="#article-7-ja"
                    className="text-primary hover:underline"
                  >
                    サービスの変更・中断・終了
                  </a>
                </li>
                <li>
                  <a
                    href="#article-8-ja"
                    className="text-primary hover:underline"
                  >
                    免責事項
                  </a>
                </li>
                <li>
                  <a
                    href="#article-9-ja"
                    className="text-primary hover:underline"
                  >
                    損害賠償
                  </a>
                </li>
                <li>
                  <a
                    href="#article-10-ja"
                    className="text-primary hover:underline"
                  >
                    著作権および知的財産権
                  </a>
                </li>
                <li>
                  <a
                    href="#article-11-ja"
                    className="text-primary hover:underline"
                  >
                    利用停止および登録抹消
                  </a>
                </li>
                <li>
                  <a
                    href="#article-12-ja"
                    className="text-primary hover:underline"
                  >
                    規約の変更
                  </a>
                </li>
                <li>
                  <a
                    href="#article-13-ja"
                    className="text-primary hover:underline"
                  >
                    準拠法および裁判管轄
                  </a>
                </li>
              </ol>
            </details>
          </nav>

          <div className="space-y-6 leading-relaxed">
            <section id="article-1-ja" className="scroll-mt-8">
              <h2 className="mb-4 font-semibold text-xl">
                第1条（目的および適用）
              </h2>
              <p>
                本利用規約（以下「本規約」といいます。）は、合同会社はっきんぐパパ（以下「当社」といいます。）が提供する「Pingo」（以下「本サービス」といいます。）の利用条件を定めるものです。本サービスを利用するすべての方（以下「利用者」といいます。）は、本規約の内容に同意のうえで本サービスを利用するものとします。本規約は、本サービスの利用に関する当社と利用者との間の一切の関係に適用されます。当社が本サービス上に掲載する各種ガイドライン、ポリシー等も本規約の一部を構成するものとします。
              </p>
            </section>

            <section id="article-2-ja" className="scroll-mt-8">
              <h2 className="mb-4 font-semibold text-xl">第2条（定義）</h2>
              <p className="mb-2">
                本規約における用語の定義は、次のとおりとします。
              </p>
              <ol className="ml-6 list-decimal space-y-2">
                <li>
                  「本サービス」とは、AIによる画像判定機能を用いたビンゴ体験を提供するオンラインサービスをいいます。
                </li>
                <li>
                  「利用者」とは、本サービスを利用するすべての個人をいいます。
                </li>
                <li>
                  「投稿データ」とは、利用者が本サービスを通じて送信・アップロードする写真、画像、その他データをいいます。
                </li>
              </ol>
            </section>

            <section id="article-3-ja" className="scroll-mt-8">
              <h2 className="mb-4 font-semibold text-xl">
                第3条（登録およびアカウント管理）
              </h2>
              <ol className="ml-6 list-decimal space-y-2">
                <li>
                  利用者は、ニックネームおよびパスワードを登録して本サービスを利用することができます。
                </li>
                <li>
                  利用者は、登録情報を自己の責任で管理するものとし、第三者に貸与、譲渡、共有してはなりません。
                </li>
                <li>
                  登録情報の漏洩や不正利用によって利用者に損害が生じた場合でも、当社は一切の責任を負いません。
                </li>
              </ol>
            </section>

            <section id="article-4-ja" className="scroll-mt-8">
              <h2 className="mb-4 font-semibold text-xl">第4条（禁止事項）</h2>
              <p className="mb-2">
                利用者は、本サービスの利用にあたり、以下の行為を行ってはなりません。
              </p>
              <ol className="ml-6 list-decimal space-y-2">
                <li>
                  法令若しくは公序良俗に違反する行為、またはそのおそれのある行為
                </li>
                <li>
                  他者の権利（著作権、肖像権、プライバシー権等）を侵害する行為
                </li>
                <li>本サービスの運営を妨害する行為</li>
                <li>虚偽の情報を登録する行為</li>
                <li>不正アクセス、システムへの侵入を試みる行為</li>
                <li>当社が不適切と判断するその他の行為</li>
              </ol>
            </section>

            <section id="article-5-ja" className="scroll-mt-8">
              <h2 className="mb-4 font-semibold text-xl">
                第5条（投稿データの取扱い）
              </h2>
              <ol className="ml-6 list-decimal space-y-2">
                <li>
                  利用者は、自己の責任において写真等を投稿するものとし、当該データに関する一切の責任を負うものとします。
                </li>
                <li>
                  投稿された画像データの著作権は利用者に帰属しますが、当社は本サービスの提供・表示等のために必要な範囲で利用することができます。
                </li>
                <li>
                  当社は、投稿データの内容を分析・学習等の目的で使用することはありません。ただし、投稿枚数や利用回数など、個人を特定できない統計情報は利用する場合があります。
                </li>
                <li>
                  利用者は、投稿データを削除することができます。当社は削除要求を受けた場合、合理的な範囲で対応します。
                </li>
              </ol>
            </section>

            <section id="article-6-ja" className="scroll-mt-8">
              <h2 className="mb-4 font-semibold text-xl">
                第6条（個人情報およびプライバシー）
              </h2>
              <ol className="ml-6 list-decimal space-y-2">
                <li>
                  本サービスでは、氏名、住所、メールアドレスなどの個人情報を取得しません。
                </li>
                <li>
                  登録時に入力されるニックネームおよびパスワードは、認証およびアカウント管理の目的に限り利用します。
                </li>
                <li>
                  当社は、利用者のプライバシーを尊重し、法令に従って適切に管理します。
                </li>
              </ol>
            </section>

            <section id="article-7-ja" className="scroll-mt-8">
              <h2 className="mb-4 font-semibold text-xl">
                第7条（サービスの変更・中断・終了）
              </h2>
              <ol className="ml-6 list-decimal space-y-2">
                <li>
                  当社は、事前の予告なく、本サービスの内容を変更、追加、停止、または終了することができます。
                </li>
                <li>
                  これにより利用者に損害が生じた場合でも、当社は一切の責任を負いません。
                </li>
              </ol>
            </section>

            <section id="article-8-ja" className="scroll-mt-8">
              <h2 className="mb-4 font-semibold text-xl">第8条（免責事項）</h2>
              <ol className="ml-6 list-decimal space-y-2">
                <li>
                  当社は、本サービスの提供に関して、明示または黙示を問わず、完全性、正確性、確実性等を保証するものではありません。
                </li>
                <li>
                  利用者が投稿したデータの内容や、これに起因して生じたトラブルについて、当社は一切の責任を負いません。
                </li>
                <li>
                  通信回線やサーバー障害、システム不具合等による損害についても、当社は責任を負いません。
                </li>
              </ol>
            </section>

            <section id="article-9-ja" className="scroll-mt-8">
              <h2 className="mb-4 font-semibold text-xl">第9条（損害賠償）</h2>
              <ol className="ml-6 list-decimal space-y-2">
                <li>
                  利用者が、本規約に違反する行為、または不正もしくは違法な行為によって、当社に損害を与え、またはそのおそれを生じさせた場合には、当社は、利用者に対して、当該行為の差止め、および当社の被った損害の賠償を請求することができるものとします。
                </li>
                <li>
                  利用者が本サイトをご利用されたこと、または何らかの原因によりこれをご利用できなかったことにより利用者に生じる一切の損害（第三者との間でトラブルが生じ、これにより利用者が被る損害を含みます。）について、当社は、何ら責任を負うものではありません。
                </li>
              </ol>
            </section>

            <section id="article-10-ja" className="scroll-mt-8">
              <h2 className="mb-4 font-semibold text-xl">
                第10条（著作権および知的財産権）
              </h2>
              <ol className="ml-6 list-decimal space-y-2">
                <li>
                  本サービス内に掲載されるプログラム、デザイン、画像、テキスト等の著作権その他の知的財産権は、当社または正当な権利者に帰属します。
                </li>
                <li>
                  利用者は、当社または第三者の権利を侵害する行為を行ってはなりません。
                </li>
              </ol>
            </section>

            <section id="article-11-ja" className="scroll-mt-8">
              <h2 className="mb-4 font-semibold text-xl">
                第11条（利用停止および登録抹消）
              </h2>
              <p>
                当社は、利用者が本規約に違反したと判断した場合、事前通知なしに当該利用者の利用停止や登録抹消を行うことができます。
              </p>
            </section>

            <section id="article-12-ja" className="scroll-mt-8">
              <h2 className="mb-4 font-semibold text-xl">
                第12条（規約の変更）
              </h2>
              <p>
                当社は、必要に応じて本規約を改定することができます。改定後の内容は、本サービス上での表示または通知をもって効力を生じます。
              </p>
            </section>

            <section id="article-13-ja" className="scroll-mt-8">
              <h2 className="mb-4 font-semibold text-xl">
                第13条（準拠法および裁判管轄）
              </h2>
              <ol className="ml-6 list-decimal space-y-2">
                <li>本規約の解釈および適用は、日本法に準拠します。</li>
                <li>
                  本サービスに関して紛争が生じた場合は、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
                </li>
              </ol>
            </section>

            <footer className="mt-12 border-t pt-8">
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">
                  施行日：2025年10月23日
                </p>
                <p className="text-muted-foreground text-sm">
                  合同会社はっきんぐパパ
                </p>
              </div>
            </footer>
          </div>
        </section>

        {/* Divider */}
        <hr className="my-16 border-t-2" />

        {/* English Version */}
        <section lang="en" data-testid="english-terms-section">
          <p className="mb-8 text-muted-foreground text-sm italic">
            The English text is below.
          </p>

          <header className="mb-8">
            <h1 className="mb-2 font-bold text-3xl md:text-4xl">
              Pingo Terms of Service
            </h1>
          </header>

          {/* Table of Contents - English */}
          <nav aria-label="Table of Contents" className="not-prose mb-12">
            <details className="rounded-lg border bg-muted/30 p-4">
              <summary className="cursor-pointer font-semibold text-lg">
                Table of Contents
              </summary>
              <ol className="ml-6 mt-4 list-decimal space-y-2">
                <li>
                  <a
                    href="#article-1-en"
                    className="text-primary hover:underline"
                  >
                    Purpose and Applicability
                  </a>
                </li>
                <li>
                  <a
                    href="#article-2-en"
                    className="text-primary hover:underline"
                  >
                    Definitions
                  </a>
                </li>
                <li>
                  <a
                    href="#article-3-en"
                    className="text-primary hover:underline"
                  >
                    Registration and Account Management
                  </a>
                </li>
                <li>
                  <a
                    href="#article-4-en"
                    className="text-primary hover:underline"
                  >
                    Prohibited Acts
                  </a>
                </li>
                <li>
                  <a
                    href="#article-5-en"
                    className="text-primary hover:underline"
                  >
                    Handling of Posted Data
                  </a>
                </li>
                <li>
                  <a
                    href="#article-6-en"
                    className="text-primary hover:underline"
                  >
                    Personal Information and Privacy
                  </a>
                </li>
                <li>
                  <a
                    href="#article-7-en"
                    className="text-primary hover:underline"
                  >
                    Changes, Suspension, and Termination of Service
                  </a>
                </li>
                <li>
                  <a
                    href="#article-8-en"
                    className="text-primary hover:underline"
                  >
                    Disclaimer
                  </a>
                </li>
                <li>
                  <a
                    href="#article-9-en"
                    className="text-primary hover:underline"
                  >
                    Damages
                  </a>
                </li>
                <li>
                  <a
                    href="#article-10-en"
                    className="text-primary hover:underline"
                  >
                    Copyright and Intellectual Property Rights
                  </a>
                </li>
                <li>
                  <a
                    href="#article-11-en"
                    className="text-primary hover:underline"
                  >
                    Suspension and Deletion of Registration
                  </a>
                </li>
                <li>
                  <a
                    href="#article-12-en"
                    className="text-primary hover:underline"
                  >
                    Changes to Terms
                  </a>
                </li>
                <li>
                  <a
                    href="#article-13-en"
                    className="text-primary hover:underline"
                  >
                    Governing Law and Jurisdiction
                  </a>
                </li>
              </ol>
            </details>
          </nav>

          <div className="space-y-6 leading-relaxed">
            <section id="article-1-en" className="scroll-mt-8">
              <h2 className="mb-4 font-semibold text-xl">
                Article 1 (Purpose and Applicability)
              </h2>
              <p>
                These Terms of Service (hereinafter referred to as "these
                Terms") set forth the terms and conditions for using "Pingo"
                (hereinafter referred to as "the Service") provided by Hacking
                Papa LLC (hereinafter referred to as "the Company"). All
                individuals who use the Service (hereinafter referred to as
                "Users") shall use the Service after agreeing to the content of
                these Terms. These Terms apply to all relationships between the
                Company and Users regarding the use of the Service. Various
                guidelines and policies posted by the Company on the Service
                shall also constitute part of these Terms.
              </p>
            </section>

            <section id="article-2-en" className="scroll-mt-8">
              <h2 className="mb-4 font-semibold text-xl">
                Article 2 (Definitions)
              </h2>
              <p className="mb-2">
                The definitions of terms in these Terms are as follows:
              </p>
              <ol className="ml-6 list-decimal space-y-2">
                <li>
                  "The Service" refers to the online service that provides bingo
                  experiences using AI-based image recognition functionality.
                </li>
                <li>"Users" refers to all individuals who use the Service.</li>
                <li>
                  "Posted Data" refers to photos, images, and other data that
                  Users send or upload through the Service.
                </li>
              </ol>
            </section>

            <section id="article-3-en" className="scroll-mt-8">
              <h2 className="mb-4 font-semibold text-xl">
                Article 3 (Registration and Account Management)
              </h2>
              <ol className="ml-6 list-decimal space-y-2">
                <li>
                  Users may use the Service by registering a nickname and
                  password.
                </li>
                <li>
                  Users shall manage their registration information at their own
                  responsibility and shall not lend, transfer, or share it with
                  third parties.
                </li>
                <li>
                  The Company shall not be liable for any damages suffered by
                  Users due to leakage or unauthorized use of registration
                  information.
                </li>
              </ol>
            </section>

            <section id="article-4-en" className="scroll-mt-8">
              <h2 className="mb-4 font-semibold text-xl">
                Article 4 (Prohibited Acts)
              </h2>
              <p className="mb-2">
                Users shall not engage in the following acts when using the
                Service:
              </p>
              <ol className="ml-6 list-decimal space-y-2">
                <li>
                  Acts that violate laws and regulations or public order and
                  morals, or acts that may do so
                </li>
                <li>
                  Acts that infringe on the rights of others (copyright,
                  portrait rights, privacy rights, etc.)
                </li>
                <li>Acts that interfere with the operation of the Service</li>
                <li>Acts of registering false information</li>
                <li>
                  Acts of attempting unauthorized access or intrusion into
                  systems
                </li>
                <li>Other acts that the Company deems inappropriate</li>
              </ol>
            </section>

            <section id="article-5-en" className="scroll-mt-8">
              <h2 className="mb-4 font-semibold text-xl">
                Article 5 (Handling of Posted Data)
              </h2>
              <ol className="ml-6 list-decimal space-y-2">
                <li>
                  Users shall post photos and other content at their own
                  responsibility and shall be responsible for all aspects of
                  such data.
                </li>
                <li>
                  Copyright of posted image data belongs to Users, but the
                  Company may use it to the extent necessary for providing and
                  displaying the Service.
                </li>
                <li>
                  The Company will not use posted data for purposes such as
                  analysis or learning. However, statistical information that
                  cannot identify individuals, such as the number of posts and
                  frequency of use, may be used.
                </li>
                <li>
                  Users may delete their posted data. The Company will respond
                  to deletion requests within a reasonable scope.
                </li>
              </ol>
            </section>

            <section id="article-6-en" className="scroll-mt-8">
              <h2 className="mb-4 font-semibold text-xl">
                Article 6 (Personal Information and Privacy)
              </h2>
              <ol className="ml-6 list-decimal space-y-2">
                <li>
                  The Service does not collect personal information such as
                  names, addresses, or email addresses.
                </li>
                <li>
                  Nicknames and passwords entered during registration are used
                  only for authentication and account management purposes.
                </li>
                <li>
                  The Company respects Users' privacy and manages it
                  appropriately in accordance with laws and regulations.
                </li>
              </ol>
            </section>

            <section id="article-7-en" className="scroll-mt-8">
              <h2 className="mb-4 font-semibold text-xl">
                Article 7 (Changes, Suspension, and Termination of Service)
              </h2>
              <ol className="ml-6 list-decimal space-y-2">
                <li>
                  The Company may change, add, suspend, or terminate the content
                  of the Service without prior notice.
                </li>
                <li>
                  The Company shall not be liable for any damages suffered by
                  Users as a result of such actions.
                </li>
              </ol>
            </section>

            <section id="article-8-en" className="scroll-mt-8">
              <h2 className="mb-4 font-semibold text-xl">
                Article 8 (Disclaimer)
              </h2>
              <ol className="ml-6 list-decimal space-y-2">
                <li>
                  The Company does not guarantee completeness, accuracy,
                  reliability, etc., whether express or implied, regarding the
                  provision of the Service.
                </li>
                <li>
                  The Company shall not be liable for the content of data posted
                  by Users or troubles arising therefrom.
                </li>
                <li>
                  The Company shall not be liable for damages caused by
                  communication line or server failures, system malfunctions,
                  etc.
                </li>
              </ol>
            </section>

            <section id="article-9-en" className="scroll-mt-8">
              <h2 className="mb-4 font-semibold text-xl">
                Article 9 (Damages)
              </h2>
              <ol className="ml-6 list-decimal space-y-2">
                <li>
                  If Users cause or threaten to cause damage to the Company
                  through acts that violate these Terms or through fraudulent or
                  illegal acts, the Company may request the cessation of such
                  acts and compensation for damages suffered by the Company.
                </li>
                <li>
                  The Company shall not be liable for any damages suffered by
                  Users as a result of using the Service or being unable to use
                  it for any reason (including damages suffered by Users due to
                  troubles with third parties).
                </li>
              </ol>
            </section>

            <section id="article-10-en" className="scroll-mt-8">
              <h2 className="mb-4 font-semibold text-xl">
                Article 10 (Copyright and Intellectual Property Rights)
              </h2>
              <ol className="ml-6 list-decimal space-y-2">
                <li>
                  Copyrights and other intellectual property rights for
                  programs, designs, images, texts, etc. posted in the Service
                  belong to the Company or legitimate rights holders.
                </li>
                <li>
                  Users shall not engage in acts that infringe on the rights of
                  the Company or third parties.
                </li>
              </ol>
            </section>

            <section id="article-11-en" className="scroll-mt-8">
              <h2 className="mb-4 font-semibold text-xl">
                Article 11 (Suspension and Deletion of Registration)
              </h2>
              <p>
                If the Company determines that a User has violated these Terms,
                it may suspend the User's use or delete their registration
                without prior notice.
              </p>
            </section>

            <section id="article-12-en" className="scroll-mt-8">
              <h2 className="mb-4 font-semibold text-xl">
                Article 12 (Changes to Terms)
              </h2>
              <p>
                The Company may revise these Terms as necessary. Revised content
                shall take effect upon display or notification on the Service.
              </p>
            </section>

            <section id="article-13-en" className="scroll-mt-8">
              <h2 className="mb-4 font-semibold text-xl">
                Article 13 (Governing Law and Jurisdiction)
              </h2>
              <ol className="ml-6 list-decimal space-y-2">
                <li>
                  The interpretation and application of these Terms shall be
                  governed by Japanese law.
                </li>
                <li>
                  In the event of disputes regarding the Service, the Tokyo
                  District Court shall be the exclusive agreed jurisdiction
                  court of first instance.
                </li>
              </ol>
            </section>

            <footer className="mt-12 border-t pt-8">
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">
                  Effective Date: October 23, 2025
                </p>
                <p className="text-muted-foreground text-sm">
                  Hacking Papa LLC
                </p>
              </div>
            </footer>
          </div>
        </section>
      </article>
    </div>
  );
}

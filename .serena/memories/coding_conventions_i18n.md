# 国際化と法的文書

## 国際化（next-intl）

### 基本ルール

- コンポーネント翻訳には`useTranslations()`フック使用
- **名前空間を省略**し、ネストされた翻訳キーでも全て記述（統一）
- 翻訳キーは`messages/ja.json`と`messages/en.json`に配置
- 日本語をプライマリ、英語をセカンダリとして扱う

### パターン

```typescript
// ❌ BAD: 名前空間使用
const t = useTranslations("Game");
t("title"); // 非推奨

// ✅ GOOD: 名前空間省略、フルパス
const t = useTranslations();
t("Game.title");
t("Game.errors.notFound");
```

### メタデータ（Server Component）

```typescript
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("Game.pageTitle"),
    description: t("Game.pageDescription"),
  };
}
```

## 法的文書の取り扱い

### 原則: 法的文書は直接埋め込み、翻訳キー化しない

利用規約、プライバシーポリシー等は翻訳キーファイルに含めず、ページに直接埋め込む

**理由**:

- ✅ 修正時の容易性（ソースコードと翻訳ファイル両方更新不要）
- ✅ 文書の完全性（全体を1箇所で確認、整合性保持）
- ✅ バージョン管理（Git履歴で変更追跡が明確）
- ✅ レビューの容易性（PR全体変更が一目で確認）

### 実装パターン

#### 1. 1ページに日英両言語含める

```typescript
// src/app/terms/page.tsx
export default async function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <article className="prose prose-sm mx-auto max-w-3xl dark:prose-invert md:prose-base">
        {/* 日本語版 */}
        <section lang="ja">
          <h1>Pingo 利用規約</h1>
          <h2>第1条 はじめに</h2>
          <p>本規約は...</p>
          {/* 全条文 */}
        </section>

        {/* 言語区切り */}
        <hr className="my-16 border-t-2" />

        {/* 英語版 */}
        <section lang="en">
          <p className="text-muted-foreground text-sm italic">
            The English text is below.
          </p>
          <h1>Pingo Terms of Service</h1>
          <h2>Article 1: Introduction</h2>
          <p>These Terms...</p>
          {/* 全条文 */}
        </section>
      </article>
    </div>
  );
}
```

#### 2. メタデータのみ翻訳キーに含める

```typescript
// messages/ja.json
{
  "Terms": {
    "pageTitle": "Pingo 利用規約",
    "pageDescription": "Pingoの利用規約とプライバシーポリシー"
  }
}

// page.tsx
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("Terms.pageTitle"),
    description: t("Terms.pageDescription"),
  };
}
```

#### 3. セマンティックHTMLとlang属性

```typescript
<section lang="ja">
  {/* 日本語コンテンツ */}
</section>

<section lang="en">
  {/* 英語コンテンツ */}
</section>
```

**Why**: `lang`属性により、スクリーンリーダーや検索エンジンが言語を正しく認識

#### 4. Tailwind Typography活用

```typescript
<article className="prose prose-sm mx-auto max-w-3xl dark:prose-invert md:prose-base">
```

**Why**:

- 法的文書に適した読みやすいタイポグラフィ
- ダークモード対応
- レスポンシブデザイン

### Storybookとの互換性

法的文書ページもStorybookストーリー作成
async Server Componentは`experimentalRSC`フラグで対応

```typescript
// src/app/terms/page.stories.tsx
const meta = {
  title: "Pages/Terms",
  component: TermsPage,  // async Server Component
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof TermsPage>;
```

**Note**: `.storybook/main.ts`で`features: { experimentalRSC: true }`有効化必要

### 適用すべきシーン

**適用する**:

- ✅ 利用規約（Terms of Service）
- ✅ プライバシーポリシー（Privacy Policy）
- ✅ 免責事項（Disclaimer）
- ✅ その他の法的文書

**適用しない**:

- ❌ 通常のUI要素（ボタン、ラベル、エラーメッセージ）→ 翻訳キー使用
- ❌ 頻繁に変更されるマーケティングコンテンツ → CMS検討
- ❌ ヘルプドキュメント → 別の文書管理システム検討

**実例**: `src/app/terms/page.tsx`, `src/app/terms/page.stories.tsx`

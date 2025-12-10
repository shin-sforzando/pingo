# Temporary Game Creation Restrictions (一時的なゲーム作成制限)

**作成日**: 2025-12-10  
**関連Issue**: #157, #158  
**ステータス**: 🟡 **有効** (限定公開期間中)  
**解除予定**: TBD

---

## 概要

限定公開期間中のゲーム作成に一時的な制限を適用しました。すべて**UIレベルの制限**であり、バックエンド（API、スキーマ）は柔軟性を維持しています。

### 制限の目的

1. **健全なコミュニティ形成**: 不適切なコンテンツの流入を防ぐ
2. **サーバー負荷管理**: 初期段階でのリソース制御
3. **段階的な機能開放**: ユーザーフィードバックを得ながら機能を拡大

---

## Issue #157: 有効期限30日制限

### 現在の制限

| 項目 | 制限前 | 制限後 |
|------|--------|--------|
| デフォルト有効期限 | 1日 | **30日** |
| 最大有効期限 | 無制限 | **30日** |
| DatePicker選択範囲 | 無制限 | 今日～30日後 |

### 実装方法

**定数定義** (`src/lib/constants.ts`):
```typescript
export const DEFAULT_GAME_EXPIRATION_DAYS = 30;
export const MAX_GAME_EXPIRATION_DAYS = 30;
```

**UI制限** (`src/app/game/create/page.tsx`):
```typescript
const maxExpiresAt = new Date();
maxExpiresAt.setDate(maxExpiresAt.getDate() + MAX_GAME_EXPIRATION_DAYS);

<Calendar
  disabled={(date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today || date > maxExpiresAt;
  }}
/>
```

### 解除方法

1. `src/lib/constants.ts` を編集:
```typescript
export const DEFAULT_GAME_EXPIRATION_DAYS = 7;  // または任意の日数
export const MAX_GAME_EXPIRATION_DAYS = 365;    // または無制限（削除）
```

2. 必要に応じて `messages/ja.json` と `messages/en.json` の `expiresAtMaxDays` メッセージを更新

---

## Issue #158: ゲーム作成オプション制限

### 1. 公開設定 (isPublic)

**制限**: 常にON（disabled、表示あり）

**理由**: 限定公開期間中は全ゲームを公開し、コミュニティ形成を促進

**実装**:
```typescript
// src/lib/constants.ts
TEMPORARY_GAME_RESTRICTIONS.forcePublicGame = true;
TEMPORARY_GAME_RESTRICTIONS.defaultIsPublic = true;

// src/app/game/create/page.tsx
<Switch
  checked={field.value}
  onCheckedChange={field.onChange}
  disabled={TEMPORARY_GAME_RESTRICTIONS.forcePublicGame}
/>
```

**解除方法**:
```typescript
TEMPORARY_GAME_RESTRICTIONS.forcePublicGame = false;
TEMPORARY_GAME_RESTRICTIONS.defaultIsPublic = false; // または true（お好みで）
```

### 2. 写真共有 (isPhotoSharingEnabled)

**制限**: 常にOFF（完全非表示）

**理由**: プライバシー保護を優先し、初期段階では写真共有を無効化

**実装**:
```typescript
// src/lib/constants.ts
TEMPORARY_GAME_RESTRICTIONS.forcePhotoSharingOff = true;
TEMPORARY_GAME_RESTRICTIONS.hidePhotoSharingOption = true;

// src/app/game/create/page.tsx
{!TEMPORARY_GAME_RESTRICTIONS.hidePhotoSharingOption && (
  <FormField name="isPhotoSharingEnabled" ... />
)}
```

**解除方法**:
```typescript
TEMPORARY_GAME_RESTRICTIONS.forcePhotoSharingOff = false;
TEMPORARY_GAME_RESTRICTIONS.hidePhotoSharingOption = false;
```

### 3. 被写体候補チェックスキップ (skipSubjectsCheck)

**制限**: スキップさせない（disabled、表示あり）

**理由**: 不適切な被写体候補の生成を防ぐ

**実装**:
```typescript
// src/lib/constants.ts
TEMPORARY_GAME_RESTRICTIONS.forceSubjectsCheckEnabled = true;

// src/app/game/create/page.tsx
<Switch
  checked={skipSubjectsCheck}
  onCheckedChange={setSkipSubjectsCheck}
  disabled={TEMPORARY_GAME_RESTRICTIONS.forceSubjectsCheckEnabled}
/>
```

**解除方法**:
```typescript
TEMPORARY_GAME_RESTRICTIONS.forceSubjectsCheckEnabled = false;
```

### 4. 投稿画像チェックスキップ (skipImageCheck)

**制限**: スキップさせない（disabled、表示あり）

**理由**: 不適切な画像投稿を防ぐ

**実装**:
```typescript
// src/lib/constants.ts
TEMPORARY_GAME_RESTRICTIONS.forceImageCheckEnabled = true;

// src/app/game/create/page.tsx
<Switch
  checked={field.value}
  onCheckedChange={field.onChange}
  disabled={TEMPORARY_GAME_RESTRICTIONS.forceImageCheckEnabled}
/>
```

**解除方法**:
```typescript
TEMPORARY_GAME_RESTRICTIONS.forceImageCheckEnabled = false;
```

### 5. 確信度閾値 (confidenceThreshold)

**制限**: 0.0～1.0 → **0.3～0.9**

**理由**: 極端な値（完全に緩い/厳しい）を避け、適度な難易度を維持

**実装**:
```typescript
// src/lib/constants.ts
export const MIN_CONFIDENCE_THRESHOLD = 0.3;
export const MAX_CONFIDENCE_THRESHOLD = 0.9;
TEMPORARY_GAME_RESTRICTIONS.minConfidenceThreshold = 0.3;
TEMPORARY_GAME_RESTRICTIONS.maxConfidenceThreshold = 0.9;

// src/app/game/create/page.tsx
<Input
  type="number"
  min={MIN_CONFIDENCE_THRESHOLD}
  max={MAX_CONFIDENCE_THRESHOLD}
  ...
/>
```

**解除方法**:
```typescript
export const MIN_CONFIDENCE_THRESHOLD = 0.0;
export const MAX_CONFIDENCE_THRESHOLD = 1.0;
TEMPORARY_GAME_RESTRICTIONS.minConfidenceThreshold = 0.0;
TEMPORARY_GAME_RESTRICTIONS.maxConfidenceThreshold = 1.0;
```

### 6. 最大投稿回数 (maxSubmissionsPerUser)

**制限**: 1～100 → **30固定**（disabled、表示あり）

**理由**: サーバー負荷とストレージ使用量の管理

**実装**:
```typescript
// src/lib/constants.ts
export const FIXED_MAX_SUBMISSIONS_PER_USER = 30;
TEMPORARY_GAME_RESTRICTIONS.fixedMaxSubmissions = true;
TEMPORARY_GAME_RESTRICTIONS.maxSubmissionsValue = 30;

// src/app/game/create/page.tsx
<Input
  type="number"
  value={FIXED_MAX_SUBMISSIONS_PER_USER}
  disabled={TEMPORARY_GAME_RESTRICTIONS.fixedMaxSubmissions}
  readOnly={TEMPORARY_GAME_RESTRICTIONS.fixedMaxSubmissions}
/>
```

**解除方法**:
```typescript
TEMPORARY_GAME_RESTRICTIONS.fixedMaxSubmissions = false;
// maxSubmissionsValueは不要になるが、残しておいても無害
```

---

## 制限解除の完全手順

### ステップ1: 定数ファイルの編集

`src/lib/constants.ts` を編集して、すべての制限を解除：

```typescript
/**
 * Game expiration configuration (Issue #157)
 */
export const DEFAULT_GAME_EXPIRATION_DAYS = 7;   // お好みの日数
export const MAX_GAME_EXPIRATION_DAYS = 365;     // または無制限

/**
 * Temporary game creation restrictions (Issue #158)
 * Set flags to false to remove restrictions in the future
 */
export const TEMPORARY_GAME_RESTRICTIONS = {
  // Public game setting
  forcePublicGame: false,           // 解除
  defaultIsPublic: false,           // お好みで

  // Photo sharing setting
  forcePhotoSharingOff: false,      // 解除
  hidePhotoSharingOption: false,    // 表示する

  // Skip checks settings
  forceSubjectsCheckEnabled: false, // 解除
  forceImageCheckEnabled: false,    // 解除

  // Confidence threshold limits
  minConfidenceThreshold: 0.0,      // 元に戻す
  maxConfidenceThreshold: 1.0,      // 元に戻す

  // Max submissions per user
  fixedMaxSubmissions: false,       // 解除
  maxSubmissionsValue: 30,          // 残しても無害
} as const;

/**
 * Confidence threshold configuration (Issue #158)
 */
export const MIN_CONFIDENCE_THRESHOLD = 0.0; // 元に戻す
export const MAX_CONFIDENCE_THRESHOLD = 1.0; // 元に戻す
export const DEFAULT_CONFIDENCE_THRESHOLD = 0.5; // 変更不要

/**
 * Max submissions per user (Issue #158)
 */
export const FIXED_MAX_SUBMISSIONS_PER_USER = 30; // 残しても無害
```

### ステップ2: i18nメッセージの更新（任意）

制限解除後も説明文を残すか、削除するかを決定：

**残す場合**:
- `messages/ja.json` と `messages/en.json` の `Game.restrictions` セクションを保持
- ユーザーに「以前は制限があった」と示すことができる

**削除する場合**:
- `Game.restrictions` セクションを削除
- `Game.expiresAtMaxDays` も更新または削除

### ステップ3: テスト実行

```bash
npm run check
npm run test
npm run build
```

### ステップ4: Storybook確認（任意）

```bash
npm run storybook
```

`Create Game Page` の `WithRestrictions` ストーリーで制限が解除されているか確認。

### ステップ5: コミット

```bash
git add src/lib/constants.ts
git add messages/ja.json messages/en.json  # i18n更新した場合
git commit -m "feat: remove temporary game creation restrictions"
```

---

## 関連ファイル一覧

### 必須ファイル（制限のコア実装）

| ファイル | 役割 | 行数 |
|---------|------|------|
| `src/lib/constants.ts` | 制限フラグと値の定義 | +44行 |
| `src/app/game/create/page.tsx` | UI制限の適用 | ~100行変更 |
| `messages/ja.json` | 日本語メッセージ | +10行 |
| `messages/en.json` | 英語メッセージ | +10行 |

### 参考ファイル（理解を深める）

| ファイル | 役割 |
|---------|------|
| `src/app/game/create/page.stories.tsx` | Storybook `WithRestrictions` ストーリー |
| `src/app/game/create/page.browser.test.tsx` | ブラウザテスト（推奨追加） |
| `src/types/schema.ts` | スキーマ定義（変更不要） |

### 変更不要ファイル（柔軟性を保持）

| ファイル | 理由 |
|---------|------|
| `src/types/schema.ts` | スキーマは柔軟性を維持 |
| `src/app/api/game/create/route.ts` | APIは制限を適用しない |
| すべてのバックエンドAPI | UIのみの制限 |

---

## トレードオフと注意点

### UI制限のみのリスク

**リスク**: API直接呼び出しで制限を回避可能

**対策**:
- ファミリーフレンドリーなアプリのため、悪意のあるユーザーは想定していない
- 必要に応じて将来的にバックエンド検証を追加可能

### 写真共有の完全非表示

**トレードオフ**: 機能の存在がユーザーに認識されない

**理由**:
- 初期段階ではプライバシー保護を優先
- 将来的に再度表示する際、「新機能」として紹介可能

### 確信度範囲の制限

**トレードオフ**: 極端な値を使いたい開発者には不便

**回避策**: `skipImageCheck` を有効にすれば画像判定をバイパス可能

### 最大投稿回数の固定

**トレードオフ**: 短期イベントゲームには多すぎる可能性

**理由**:
- 初期段階ではサーバー負荷を抑制
- ほとんどのゲームで30回は十分

---

## 制限の背景と設計思想

### なぜUIレベルの制限なのか？

1. **迅速な実装**: バックエンド変更なしで制限を適用
2. **柔軟な解除**: 定数変更だけで即座に解除可能
3. **スキーマの柔軟性**: 将来の機能拡張に対応
4. **低リスク**: ファミリーフレンドリーなアプリのため、API直接呼び出しによる悪用リスクは低い

### なぜ定数で管理するのか？

1. **一元管理**: すべての制限を1つのファイルで管理
2. **可読性**: `TEMPORARY_GAME_RESTRICTIONS` オブジェクトで制限の全体像を把握
3. **保守性**: 将来の開発者が簡単に理解・変更可能
4. **型安全**: TypeScriptの型チェックで誤った値を防ぐ

### なぜ説明文を表示するのか？

1. **透明性**: ユーザーに制限の理由を説明
2. **期待管理**: 「将来的に変更される可能性がある」と示唆
3. **フィードバック**: ユーザーが制限について意見を言いやすい

---

## よくある質問（FAQ）

### Q1: 制限を部分的に解除できますか？

**A**: はい、`TEMPORARY_GAME_RESTRICTIONS` の各フラグは独立しています。例えば、写真共有だけを有効にすることも可能です。

```typescript
TEMPORARY_GAME_RESTRICTIONS.hidePhotoSharingOption = false; // 写真共有のみ表示
TEMPORARY_GAME_RESTRICTIONS.forcePublicGame = true;         // 他は維持
```

### Q2: 制限解除後、既存のゲームはどうなりますか？

**A**: 既存のゲームは影響を受けません。制限はゲーム作成時のUIにのみ適用されており、作成済みのゲームデータには影響しません。

### Q3: バックエンド検証を追加すべきですか？

**A**: 現時点では不要です。ファミリーフレンドリーなアプリであり、API直接呼び出しによる悪用リスクは低いです。ただし、将来的にユーザー数が増えた場合は検討すべきです。

### Q4: 制限解除のタイミングはいつですか？

**A**: 以下の条件を満たしたタイミングで検討します：
- ユーザーフィードバックで問題が報告されていない
- サーバー負荷が安定している
- 限定公開期間が終了した

### Q5: 制限解除時に必要なテストは？

**A**: 以下のテストを推奨します：
- 既存の単体テスト（すべて通過するはず）
- ブラウザテスト（UI動作確認）
- Storybookでの視覚確認
- 実際のゲーム作成フロー（手動テスト）

---

## 関連ドキュメント

- `current_status_priorities` メモリー - 実装完了状況
- `suggested_commands` メモリー - `delete-game-data` コマンド
- `CLAUDE.md` - プロジェクト全体のルール
- `/Users/suzuki/.claude/plans/lazy-fluttering-brooks.md` - 実装計画（完了）

---

**最終更新**: 2025-12-10  
**更新者**: Claude Code  
**次回レビュー**: 限定公開期間終了時

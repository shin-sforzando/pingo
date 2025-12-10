# Current Status & Priorities

**Last Updated**: 2025-12-10

## ✅ Recently Completed

### Issue #157 & #158: Temporary Game Creation Restrictions (限定公開期間の制限)

限定公開期間中のゲーム作成に一時的な制限を適用しました。**すべてUIレベルの制限であり、バックエンド（API、スキーマ）は柔軟性を維持しています。**

#### Issue #157: Game Expiration Limit (有効期限30日制限)

- **デフォルト有効期限**: 1日 → **30日**
- **最大有効期限**: 無制限 → **30日**
- **実装**: `react-day-picker` の `disabled` プロパティで30日以降を選択不可

#### Issue #158: Game Creation Options Restrictions (ゲーム作成オプション制限)

以下の設定に制限を適用：

1. **公開設定**: 常にON（disabled、表示あり）
2. **写真共有**: 常にOFF（完全非表示）
3. **被写体候補チェックスキップ**: スキップさせない（disabled、表示あり）
4. **投稿画像チェックスキップ**: スキップさせない（disabled、表示あり）
5. **確信度閾値**: 0.0～1.0 → **0.3～0.9**
6. **最大投稿回数**: 1～100 → **30固定**（disabled、表示あり）

#### 実装方針

- **UI制限のみ**: API直接呼び出しで制限を回避可能（ファミリーフレンドリーアプリのため低リスク）
- **定数で集中管理**: `src/lib/constants.ts` で `TEMPORARY_GAME_RESTRICTIONS` オブジェクトとして管理
- **多言語対応**: 日本語・英語で制限の説明文を追加
- **将来の解除が容易**: フラグを `false` にするだけで制限を解除可能

#### 変更ファイル

**定数定義**:
- `src/lib/constants.ts` - 制限フラグと値の定義（約40行追加）

**UI実装**:
- `src/app/game/create/page.tsx` - 各種制限の適用（約100行変更）
  - DatePicker制限
  - Switch の disabled 適用
  - Input の min/max 制限
  - 条件付きレンダリング（写真共有の非表示）

**i18n**:
- `messages/ja.json` - 制限説明メッセージ（約10行追加）
- `messages/en.json` - 制限説明メッセージ（約10行追加）

**Storybook**:
- `src/app/game/create/page.stories.tsx` - `WithRestrictions` ストーリー追加

#### 将来の制限解除方法

`src/lib/constants.ts` で以下のフラグを変更するだけ：

```typescript
export const TEMPORARY_GAME_RESTRICTIONS = {
  forcePublicGame: false,          // 制限解除
  hidePhotoSharingOption: false,   // 表示する
  forceSubjectsCheckEnabled: false,// 制限解除
  forceImageCheckEnabled: false,   // 制限解除
  // ...
} as const;

export const MIN_CONFIDENCE_THRESHOLD = 0.0; // 元に戻す
export const MAX_CONFIDENCE_THRESHOLD = 1.0; // 元に戻す
```

詳細は `temporary_restrictions` メモリーを参照。

---

### Data Cleanup Script (ゲームデータ削除スクリプト)

古いゲームデータを一括削除するメンテナンススクリプトを実装しました。

#### 機能

- Firestore の `games` コレクションとサブコレクションを削除
- Firebase Storage の画像ファイルを削除
- ユーザードキュメントからゲーム履歴をクリア（ユーザーアカウントは保持）
- 日付範囲指定による柔軟な削除

#### 使用方法

```bash
# デフォルト（7日より古いゲームを削除）
npm run delete-game-data

# 30日より古いゲームを削除
npm run delete-game-data -- --days=30

# 特定日付より前のゲームを削除
npm run delete-game-data -- --before=2024-12-01

# 全ゲームを削除
npm run delete-game-data -- --all
```

#### 実装ファイル

- `scripts/delete-game-data.ts` - メインスクリプト（400+行）
- `package.json` - `delete-game-data` npm スクリプト追加

#### 技術的な工夫

- **環境変数読み込み**: async関数内でdynamic importを実行し、dotenvの後にFirebase Admin SDKを初期化
- **バッチ削除**: Firestore（500件）、Storage（100件）ごとにバッチ処理
- **レート制限対策**: 各操作間に適切な遅延を挿入

---

### Relaxed Subjects Check Prompt (被写体候補チェックの緩和)

Issue #158で公序良俗チェックを強制化した結果、「お寿司」などの一般的な食品が過度に拒否される問題が発生。プロンプトを緩和しました。

#### 変更内容

**変更前（厳格）**:
- アレルギー成分を含む食品を拒否
- 宗教的配慮が必要なものを拒否
- 軽微な安全懸念がある道具を拒否

**変更後（緩和）**:
```typescript
IMPORTANT: Do NOT reject subjects based on:
- Allergies or dietary restrictions (e.g., "sushi", "peanuts", "milk" are acceptable)
- Religious or cultural sensitivities (e.g., foods, clothing, symbols are acceptable unless explicitly offensive)
- Minor safety concerns (e.g., "ladder", "knife" as everyday objects are acceptable)
- AI recognition difficulty (players can decide if they want challenging subjects)
```

#### テスト追加

`src/app/api/subjects/check/route.test.ts` に4つのテストケースを追加：
- 食品アレルギー関連（日本語・英語）
- 日常的な道具の軽微な安全懸念（日本語・英語）

**結果**: 全21テストが通過（新規4テスト含む）

---

### Skip Check Features Implementation

開発・テスト環境向けに、公序良俗チェックをスキップする機能を実装しました。

#### 実装内容

#### 1. 被写体候補チェックのスキップ (skipSubjectsCheck)

- **用途**: ゲーム作成時の被写体候補チェックをスキップ
- **実装方法**: UIローカル状態（`useState`）のみ、データベース保存なし
- **理由**: ゲーム作成後に使用されないため

```typescript
// src/app/game/create/page.tsx
const [skipSubjectsCheck, setSkipSubjectsCheck] = useState(false);

if (!skipSubjectsCheck) {
  // Validate subjects...
}
```

#### 2. 投稿画像チェックのスキップ (skipImageCheck)

- **用途**: ゲーム中の投稿画像の適切性チェックをスキップ
- **実装方法**: データベースに保存（ゲーム設定の一部）
- **理由**: ゲームのライフサイクル全体で使用される

#### 変更ファイル

**型定義とスキーマ**:

- `src/types/schema.ts` - `gameSchema`, `gameCreationSchema`に`skipImageCheck`を追加
- `src/types/game.ts` - `GameDocument`, `gameFromFirestore`, `gameToFirestore`に`skipImageCheck`を追加

**API実装**:

- `src/app/api/game/create/route.ts` - ゲーム作成時に`skipImageCheck`を保存
- `src/app/api/image/check/route.ts` - ゲーム設定を確認してチェックをスキップ
  - リクエストに`gameId`パラメータを追加
  - `AdminGameService.getGame()`でゲーム取得
  - `game.skipImageCheck === true`の場合は早期リターン

**UI実装**:

- `src/app/game/create/page.tsx` - 両方のスイッチを追加
- `src/services/image-upload.ts` - チェックAPIに`gameId`を渡す

**i18n**:

```json
{
  "skipSubjectsCheck": "被写体候補のチェックをスキップ",
  "skipSubjectsCheckDescription": "ゲーム作成時の被写体候補のチェックをスキップします。",
  "skipImageCheck": "投稿画像のチェックをスキップ",
  "skipImageCheckDescription": "ゲーム中の投稿画像のチェックをスキップします。"
}
```

**テスト更新**:

- `src/app/api/game/create/route.test.ts` - テストデータに`skipImageCheck`を追加
- `src/app/api/image/check/route.test.ts` - 完全リライト
  - `AdminGameService`のモック追加
  - 全リクエストに`gameId`を追加
  - `skipImageCheck`機能の新規テストケース追加（2テスト）

#### テスト結果

- ✅ **全17テストが成功** (image/check: 13, game/create: 4)
- ✅ **カバレッジ向上**: image/check API 98.07%

## ✅ Previously Completed

### Major Architecture Refactoring - Single Responsibility Principle

画像処理APIを単一責任の原則に基づいて3つのエンドポイントに分離しました。

#### 変更内容

**Old Architecture** (1つのエンドポイントで6つの責任):

- `/api/image/check` - すべての処理（適切性チェック、分析、状態更新など）

**New Architecture** (3つのエンドポイント、各1つの責任):

1. `/api/image/check` - **適切性チェックのみ**
   - Gemini APIで画像が全年齢対象として適切かを検証
   - ゲーム設定によりチェックをスキップ可能（`skipImageCheck`） 🆕
   - Response: `{ appropriate: boolean, reason?: string }`

2. `/api/game/[gameId]/submission/analyze` - **ビンゴマッチング分析のみ**
   - 画像と利用可能なビンゴセルのマッチング分析
   - 多言語critique生成 (critique_ja, critique_en)
   - Response: `{ matchedCellId, confidence, critique_ja, critique_en, acceptanceStatus }`

3. `/api/game/[gameId]/submission` - **状態管理のみ**
   - Submission作成
   - PlayerBoard更新
   - ビンゴライン検出
   - Response: `{ newlyCompletedLines, totalCompletedLines, requiredBingoLines }`

### Generate API の品質向上とテスト安定化

#### 問題

- Gemini APIが制御文字 (`\b`, `\n`) を含む被写体を生成
- generate/check API統合テストが不安定（非決定性）
- テスト実行時間が長い（86秒）

#### 解決策

1. **プロンプトの強化**
   - IMPORTANT/CRITICAL キーワードで厳格さを要求
   - 抽象概念・武器・不適切コンテンツの具体例を明示
   - 応答前の自己検証を指示

2. **内部検証の追加** (`src/app/api/subjects/generate/route.ts`)
   - 制御文字の除去
   - 空文字列の除外
   - 大文字小文字を区別しない重複チェック

3. **テスト並行度の最適化** (`vitest.config.mts`)
   - Firebase 12.6.0対応で`fileParallelism: false`に変更
   - テスト時間: 28秒 → 77秒（安定性重視）

4. **Retry メカニズム** (`route.test.ts`)
   - `{ retry: 2 }` でGemini API非決定性に対応
   - タイムアウト: 45秒に最適化

#### 結果

- ✅ **全403テストが安定して成功**
- ✅ **flaky testが完全に解消**
- ✅ **開発体験の大幅向上**

## 📋 Current Priorities

### High Priority

1. Issue #157 & #158のブランチをmainにマージ
2. 本番デプロイ前の最終チェック

### Medium Priority

1. Storybook coverage の向上
   - ImageUpload コンポーネント
   - GameBoard 関連コンポーネント

### Low Priority

1. テストカバレッジの向上（現在の主要機能は網羅済み）
2. パフォーマンス最適化

## 🔧 Known Issues

**None** - 全テストが通過し、依存関係も最新に更新されました。

## 🎯 Next Steps

1. Issue #157 & #158のPull Request作成
2. レビュー後にmainへマージ
3. 一時的な制限の解除タイミングを決定
4. 本番環境へのデプロイ準備

## 📊 Test Status

- **Total Tests**: 403+ passed
- **Test Files**: 44+ passed
- **Duration**: ~77 seconds
- **Coverage**: Good (主要機能は網羅)

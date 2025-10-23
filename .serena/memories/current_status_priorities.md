# Current Status & Priorities

**Last Updated**: 2025-10-20

## ✅ Recently Completed

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
   - `maxForks: 3` でGemini APIレート制限に対応
   - テスト時間: 86秒 → 28秒 (67%短縮)

4. **Retry メカニズム** (`route.test.ts`)
   - `{ retry: 2 }` でGemini API非決定性に対応
   - タイムアウト: 45秒に最適化

#### 結果

- ✅ **全302テストが安定して成功**
- ✅ **テスト時間67%短縮** (86秒 → 28秒)
- ✅ **開発体験の大幅向上**

## 📋 Current Priorities

### High Priority

1. 本番デプロイ前の最終チェック

### Medium Priority

1. Storybook coverage の向上
   - ImageUpload コンポーネント
   - GameBoard 関連コンポーネント

### Low Priority

1. テストカバレッジの向上（現在の主要機能は網羅済み）
2. パフォーマンス最適化

## 🔧 Known Issues

**None** - 全テストが通過し、アーキテクチャも改善されました。

## 🎯 Next Steps

1. Git branch作成とコミット
2. Pull Request作成
3. レビュー後にmainへマージ
4. 本番環境へのデプロイ準備

## 📊 Test Status

- **Total Tests**: 302+ passed
- **Test Files**: 38+ passed
- **Duration**: ~28 seconds
- **Coverage**: Good (主要機能は網羅)

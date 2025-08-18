# 推奨コマンド一覧

## 開発作業

### 基本的な開発コマンド
```bash
# 開発サーバー起動（Turbopack使用）
npm run dev

# プロダクションビルド
npm run build

# プロダクションサーバー起動
npm run start
```

### コード品質管理
```bash
# Biomeによるフォーマット・リント（書き込み有効）
npm run check

# 国際化チェック
npm run check:i18n
```

### テスト実行
```bash
# Vitest（ウォッチモード）
npm test

# Vitestテスト（単回実行）
npm run test:once

# Vitest（ウォッチモード、カバレッジなし）
npm run test:watch

# E2Eテスト（Playwright）
npm run test:e2e

# E2Eテストデバッグモード
npm run test:e2e:debug

# モバイルE2Eテスト
npm run test:e2e:mobile
```

### Storybook
```bash
# Storybook開発サーバー起動
npm run storybook

# Storybookビルド
npm run build-storybook
```

### Docker
```bash
# Dockerイメージビルド＆実行
npm run docker

# Dockerイメージビルド
npm run docker:build
```

### 依存関係・保守
```bash
# パッケージ更新チェック
npm run ncu

# 未使用の依存関係チェック
npm run knip

# コードベース分析
npm run repomix
```

## Git・セキュリティ

### git-secret関連
```bash
# シークレットを復号化
git secret reveal

# シークレットを暗号化
git secret hide -mF
```

### Google Cloud認証
```bash
# ADC設定（ローカル開発用）
gcloud auth application-default login

# GCS CORS設定
gsutil cors set gcs-pingo-cors-config.json gs://gcs-pingo
```

## タスク完了時の確認コマンド

タスク完了時は必ず以下のコマンドを実行して確認：

1. **コード品質チェック**
   ```bash
   npm run check
   ```

2. **テスト実行**
   ```bash
   npm run test:once
   ```

3. **ビルド確認**
   ```bash
   npm run build
   ```

4. **国際化チェック**（i18n関連の変更時）
   ```bash
   npm run check:i18n
   ```

## 注意事項
- lefthookによるpre-commitフックが設定されているため、コミット時に自動でチェックが実行される
- テストは必ず`npm run test:once`で実行（ウォッチモードは使用しない）
- プライベートデータは必ずgit-secretで暗号化する
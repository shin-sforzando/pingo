# Firebase Firestore with Type Converters

このディレクトリには、Firebase Firestoreとの型安全な通信を行うためのユーティリティが含まれています。

## 型変換（Type Conversion）の利点

Firestoreの`withConverter`APIを使用することで、以下のメリットがあります：

1. **型安全性**: TypeScriptの型チェックが強化され、コンパイル時にエラーを検出できます
2. **コード量の削減**: 手動での型変換が不要になり、コードがシンプルになります
3. **一貫性の保証**: データの変換プロセスが一元化され、一貫性が保たれます
4. **開発効率の向上**: 自動補完が効くため、開発速度が向上します

## 使用方法

### コレクション参照の取得

```typescript
import { getUsersCollection, getUserDoc } from '@/lib/firebase/collections';

// ユーザーコレクションの参照を取得（型変換付き）
const usersRef = getUsersCollection();

// 特定のユーザードキュメントの参照を取得（型変換付き）
const userRef = getUserDoc('user-id');
```

### ドキュメントの読み取り

```typescript
import { getUserDoc } from '@/lib/firebase/collections';
import { getDoc } from 'firebase/firestore';

// ユーザードキュメントを取得
const userRef = getUserDoc('user-id');
const docSnap = await getDoc(userRef);

if (docSnap.exists()) {
  // データは自動的にUser型に変換されます
  const userData = docSnap.data();
  console.log(userData.username); // 型安全なアクセス
  console.log(userData.createdAt.toLocaleDateString()); // Dateオブジェクトとして使用可能
}
```

### ドキュメントの書き込み

```typescript
import { getUserDoc } from '@/lib/firebase/collections';
import { setDoc, updateDoc } from 'firebase/firestore';
import type { User } from '@/types/schema';

// 新しいユーザーを作成
const newUser: User = {
  id: 'user-id',
  username: 'username',
  createdAt: new Date(),
  lastLoginAt: null,
  participatingGames: [],
  gameHistory: [],
  isTestUser: false
};

// ドキュメントを保存（User型からFirestoreドキュメントへの変換は自動的に行われます）
const userRef = getUserDoc(newUser.id);
await setDoc(userRef, newUser);

// ドキュメントを更新
await updateDoc(userRef, {
  username: 'new-username',
  updatedAt: new Date()
});
```

### クエリの実行

```typescript
import { getUsersCollection } from '@/lib/firebase/collections';
import { query, where, getDocs } from 'firebase/firestore';

// クエリを作成
const usersRef = getUsersCollection();
const q = query(usersRef, where('isTestUser', '==', true));

// クエリを実行
const querySnapshot = await getDocs(q);

// 結果を処理（各ドキュメントは自動的にUser型に変換されます）
querySnapshot.forEach((doc) => {
  const userData = doc.data();
  console.log(userData.username);
});
```

## 利用可能なコレクション

現在、以下のコレクションに対する型変換が実装されています：

- `users`: ユーザー情報
- `notifications`: 通知情報

必要に応じて、他のコレクションの型変換も同様のパターンで実装できます。

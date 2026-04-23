# Japanese Glossary

Use clear, concise Japanese for UI labels. Prefer consistency over stylistic variation.

This glossary is a starting point for AI-assisted draft translations. Japanese terminology should still be reviewed by a fluent Japanese speaker before release.

## Core Terms

- article -> 記事
- item -> アイテム
- content -> コンテンツ
- headline -> 見出し
- slugline -> スラッグライン
- byline -> 署名
- desk -> デスク
- stage -> ステージ
- workspace -> ワークスペース
- assignment -> アサインメント
- planning -> プランニング
- event -> イベント
- coverage -> 取材
- vocabulary -> ボキャブラリー
- dictionary -> 辞書
- template -> テンプレート
- preview -> プレビュー
- publish -> 公開
- unpublish -> 公開を取り消す
- schedule -> スケジュール
- save -> 保存
- close -> 閉じる
- cancel -> キャンセル
- delete -> 削除
- filter -> フィルター
- search -> 検索
- settings -> 設定
- user -> ユーザー
- language -> 言語
- translation -> 翻訳
- ingest -> 取り込み
- source -> ソース
- subscriber -> 配信先
- package -> パッケージ
- rundown -> ランダウン

## Tone

- Keep UI labels short and direct.
- Prefer common product UI wording over literal translation.
- Use polite but concise Japanese for messages.
- Keep product names such as `Superdesk` untranslated.
- Use Japanese punctuation where natural, such as `。`, `、`, `：`, and `？`.
- Avoid unnecessary spaces between Japanese text and punctuation.

## Consistency Rules

- Preserve established translations already present in `po/ja.po` once that file exists, unless a correction is separately approved.
- Do not translate placeholders, field identifiers, internal codes, or product names.
- Preserve all `{{...}}` placeholders exactly, including spaces inside placeholders.
- Avoid adding spaces around placeholders unless the surrounding Japanese text requires it for readability.
- If a source term is ambiguous, leave it for manual review instead of forcing a glossary match.
- If an English editorial term is commonly used as-is in product context, prefer the glossary katakana form.

## Review-Required Terms

These terms are context-sensitive. Use the glossary default only when the UI context is clear; otherwise skip the entry for human review.

- desk -> デスク
- stage -> ステージ
- slugline -> スラッグライン
- assignment -> アサインメント
- planning -> プランニング
- coverage -> 取材
- rundown -> ランダウン
- subscriber -> 配信先

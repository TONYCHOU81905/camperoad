# API 路徑統一規則

## 1. API 網址格式

- **原本格式 (雙引號)：**
  "http://localhost:8081/CJA101G02/member/${memId}/picture"

- **新格式 (反引號)：**
  `${window.api_prefix}/member/${memId}/pic?t=${timestamp}`

  - `window.api_prefix` 由 `js/camp-data.js` 提供，方便環境切換。
  - `timestamp` 可用於避免快取。

## 2. HTML 檔案規範

- 所有有 API 請求的 HTML 檔案，<head> 必須加上：
  ```html
  <script src="js/camp-data.js"></script>
  ```

## 3. 其他注意事項

- 請一律使用反引號（`）包裹字串，方便插入變數。
- API 路徑請勿硬編碼主機位址，統一用 `window.api_prefix`。
- 若有快取疑慮，請於路徑加上 `?t=${timestamp}`。 
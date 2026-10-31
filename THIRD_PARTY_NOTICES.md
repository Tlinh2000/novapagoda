# Third-party notices / Điều kiện phân phối

Code gốc, nhân vật do dự án tạo, tranh SVG và cảnh tạo bằng mã được cấp MIT như LICENSE. **Giấy phép MIT không áp dụng cho các tài nguyên dưới đây.**

## Stanford Happy Buddha scan

- Original dataset: Stanford University Computer Graphics Laboratory.
- Acquisition/reconstruction: Brian Curless and Marc Levoy, 1996.
- Primary source: https://graphics.stanford.edu/data/3Dscanrep/
- Description: https://graphics.stanford.edu/software/scanview/models/happybuddha.html
- OBJ mirror: Alec Jacobson, common-3d-test-models, https://github.com/alecjacobson/common-3d-test-models/blob/master/data/happy.obj
- Included files: `source-assets/happy.obj`, `client/assets/models/buddha-detail.glb`.
- Changes: format converted OBJ → GLB; duplicate vertices merged, smooth normals calculated, height normalized, gold material applied. Statue remains static.

Stanford permits free mirroring/redistribution and research use with source acknowledgement. Commercial use or inclusion in a product for sale requires their permission. See the source page's “Please acknowledge” and “Inappropriate uses” sections. This educational package is distributed free of charge. Replace the model with a commercially licensed alternative or obtain permission before commercial distribution. Do not label the scan as a Vietnamese historical artifact.

Acknowledgement: **Happy Buddha model courtesy of the Stanford Computer Graphics Laboratory.**

## CBETA scripture data

- Contributor/distributor: Comprehensive Buddhist Electronic Text Archive Foundation (CBETA).
- Base edition: Taishō Tripiṭaka / 大正新脩大藏經 (Daizo Publishing Co., Ltd.).
- Texts: T14n0450, T08n0251, T12n0368.
- Source repository: https://github.com/cbeta-org/xml-p5
- Reader: https://cbetaonline.dila.edu.tw/
- Current copyright statement: https://cbeta.org/copyright
- Licence: **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International**, https://creativecommons.org/licenses/by-nc-sa/4.0/ , subject to the source edition categories in the copyright statement.

The original XML files are included unchanged with all header, edition/date, contributor and availability metadata in `client/data/sources/`. These headers are part of the distribution. Original wording includes: “Available for non-commercial use when distributed with this header intact.”

Derived reader data in `client/data/canonical.js` omit line markers, anchors and inline reading notes, and select the main scripture division. XML originals retain prefaces, colophons, notes and variant readings. `client/data/sutras.js` includes a new Vietnamese translation of only the twelve Medicine Buddha vows and Hán Việt readings, labelled as such. These CBETA-derived data and adaptations retain CC BY-NC-SA 4.0; changes are described here. This licence does not relicense the independent game code.

CBETA's current use statement, reproduced for accompanying attribution:

1. 非營利使用：本資料庫之使用限定於個人或團體非營利性用途。
2. 再傳播規範：將本資料庫以網路、光碟或其它媒體再傳播、節錄引用及再加工發行時，以不改變實質內容為原則，並需於成品附上本說明及版本資訊，以利使用者查詢相關修訂資訊。
3. 錯誤回報：若發現本資料庫中任何錯誤之處，請與本會聯絡。
4. 免責聲明：若因使用本資料庫所產生之任何損害，本會一概不負任何責任。
5. 核心授權：除下方「二、底本來源與授權分類」中特別註明不適用之文獻外，本資料庫未特別說明處皆採用「Creative Commons 姓名標示-非商業性-相同方式分享 4.0 國際授權條款」釋出。

English summary: non-commercial use; preserve substantive content and accompany redistribution/excerpts/rework with this statement and version information; report errors to CBETA; no liability; the specified core data use CC BY-NC-SA 4.0 with source-category exceptions. Check the full copyright page for the current complete statement and source-edition categories.

## Dependencies

Express, Socket.io, Three.js, MongoDB driver, Helmet, express-rate-limit, dotenv, Multer and Sharp retain their own upstream licences installed by npm. No artwork/code from sansatemple.com is included. No Adobe Mixamo download is bundled; Mixamo is documented only as an optional replacement workflow. User-supplied images, models and recordings retain their owners' rights.

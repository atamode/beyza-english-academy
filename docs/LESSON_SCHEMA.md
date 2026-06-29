# Ders Veri Sözleşmesi

Her ders JSON dosyası `id`, `title`, `level`, `module`, `objectives`, `screens` ve `assessment` alanlarını taşır. Ekranlar benzersiz `id`, desteklenen `type` ve `title` alanlarına sahiptir.

Desteklenen türler: `intro`, `explanation`, `example`, `rule-table`, `multiple-choice`, `fill-blank`, `sentence-order`, `matching`, `error-find`, `listening`, `speaking`, `reading`, `mini-game`, `summary`.

Seçenekli sorularda `options`, `correctIndex` ve seçenek sayısıyla aynı uzunlukta `optionExplanationsTr` veya `explanationsTr` zorunludur. Puanlı ekranlar `points` taşır. Ayrıntılı JSON Schema, proje kökündeki `lesson.schema.json` dosyasındadır.
